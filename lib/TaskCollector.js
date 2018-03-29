"use babel";

const {
    Directory
} = require("atom");

import durationStore from "./DurationStore.js";

/**
 * Class responsible to collect all tasks from plugins
 */
class TaskCollector {

    constructor(atomPanelView) {
        this.plugins = {}; // Maps all created plugin instances to the pluginname
        this.atomPanelView = atomPanelView; // Needed to add output from the task to the bottom panel
        this.touchbar = null; // Instance of a touchbar class. Used to update task progress and state
        this.currentTimerId = 0; // Current timer id for the task update

        this.isTaskRunning = false; // Whether a task is currently running
        this.taskWasKilled = false; // Whether the currently running task was killed
        this.currentTaskPlugin = ""; // Name of the plugin the currently running task belongs to
        this.currentTaskName = ""; // Name of the currently running task
        this.taskStartTime = 0; // Timestamp of the task start
        this.taskExpectedTime = 0; // The expected time the task is run. Equals the time it needed on the last successfull execution

        let files = new Directory(__dirname + "/TaskCollectors"); // TODO: Use proper os path join
        let entries = files.getEntriesSync();

        // Only list directories
        let directories = entries.filter(entry => entry instanceof Directory);

        // Iterate through the TaskCollector directory. Every plugin.js is expected to be inside its own directory.
        // The only file which is directly inside the directory is the abstract class, so we can safely ignore that
        for (let idx in directories) { // TOOD: Check has own property
            let directory = directories[idx];
            let pluginFile = directory.getFile("plugin.js");
            if (!pluginFile.existsSync()) {
                continue;
            }
            let Plugin = require(pluginFile.getPath());
            let plugin = new Plugin(this);
            this.plugins[plugin.getName()] = plugin;
        }
    }

    /**
     * Sets the touchbar to the given touchbar instance
     * @param {Object} touchbar Instance of a Touchbar class
     */
    setTouchbar(touchbar) {
        this.touchbar = touchbar;
    }

    /**
     * Returns all tasks from plugins for the current project.
     * @return {object} A object holding all tasks. Structure is as follows:
     * {
     *      "NPM": ["Task1", "Task2"],
     *      "Grunt": ["Task1", "Task2"],
     *      ...
     * }
     */
    getTasks() {
        let tasks = {};

        if(!atom.project.getPaths()[0]) {
            return tasks;
        }

        // Iterate through every plugin and call its getTasks function
        for (let idx in this.plugins) {
            if (!this.plugins.hasOwnProperty(idx)) {
                continue;
            }
            let plugin = this.plugins[idx];

            let pluginTasks = plugin.getTasks();

            if(pluginTasks.length === 0) {
                continue;
            }

            tasks[plugin.getName()] = pluginTasks;
        }
        return tasks;
    }

    /**
     * Run the given task from the given plugin. If the given task is already running
     * the task will be aborted.
     * @param  {string} pluginName The pluginname to which the task belongs
     * @param  {string} taskName   The name of the task which should be executed
     * @return {undefined}
     */
    runTask(pluginName, taskName) {
        // If the task is already running, abort it
        // If any other task is running just ignore the process
        // Unfortunately due to electrons limited api support currently
        // we cannot disable the click animation on touchbar buttons
        if(this.isTaskRunning) {
            if(pluginName === this.currentTaskPlugin && taskName === this.currentTaskName) {
                this.killTask();
            }
            return;
        }

        this.isTaskRunning = true;
        this.taskWasKilled = false;
        this.currentTaskPlugin = pluginName;
        this.currentTaskName = taskName;
        this.taskStartTime = Date.now();
        this.atomPanelView.clear();

        // Get the expected duration for the task. null is none was found
        let projectDirectory = new Directory(atom.project.getPaths()[0]);
        this.taskExpectedTime = durationStore.getDuration(projectDirectory.getBaseName(), pluginName, taskName);
        this.taskExpectedTime = this.taskExpectedTime === 0 ? 1 : this.taskExpectedTime;

        this.touchbar.startRunningTask(pluginName, taskName, this.taskExpectedTime === null);
        this.plugins[pluginName].runTask(taskName);

        // Update the task immediately
        this.currentTimerId = setTimeout(this.updateTask.bind(this), 0);
    }

    /**
     * Updates the progress of the currently running task.
     * @return {undefined}
     */
    updateTask() {
        // If no task is running we will stop the update cycle
        if(this.isTaskRunning === false) {
            this.currentTimerId = 0;
            return;
        }

        // If its an task with an unknown duration we just need to update our
        // infinite loader every 30ms
        if(this.taskExpectedTime === null) {
            this.touchbar.updateRunningTask();
            this.currentTimerId = setTimeout(this.updateTask.bind(this), 30);
        } else {
            // If the task duration is known,we only need to update the tasks
            // 100 times. Once for each percent.
            let currentTime = Date.now();
            let duration = currentTime - this.taskStartTime;
            let progress = (duration / this.taskExpectedTime)*100;

            // We actually never want the progress to reach 100. As our duration
            // is only an estimation, there´s quite a high chance that the task will run a big longer.
            // The user should not stare at a finished progressbar wondering why it is not finishing.
            if(progress >= 100) {
                progress = 99;
            }

            // Update the task on the touchbar and set the timer for the next update.
            this.touchbar.updateRunningTask(progress);
            this.currentTimerId = setTimeout(this.updateTask.bind(this), this.taskExpectedTime / 100);
        }
    }

    /**
     * Finishes the progress of the current task really fast. The callback will be called
     * when the progress reached 99%. This function can be used to finish the current progressbar
     * in case the task finished earlier than expected.
     * @param  {Function} callback          Function to call when the progressbar is at 99%
     * @param  {Integer}   simulatedProgress Used internally for recursive calls. Not needed for the initial call.
     * @return {undefined}
     */
    fastForwardTaskAnimation(callback, simulatedProgress) {
        let currentTime = Date.now();
        let duration = currentTime - this.taskStartTime;
        let progress = duration / this.taskExpectedTime;

        // For recursive calls , override the progress
        simulatedProgress = simulatedProgress || (progress * 100);

        if(simulatedProgress > 100) {
            callback();
        } else {
            simulatedProgress += 1;
            this.touchbar.updateRunningTask(simulatedProgress);
            setTimeout(() => {
                this.fastForwardTaskAnimation(callback, simulatedProgress);
            }, 1);
        }
    }

    /**
     * Finishes the given task. Clears the update timeout and updates the touchbar.
     * @param  {boolean} success Whether the task finished successfully
     * @return {undefined}
     */
    finishedTask(success) {

        clearTimeout(this.currentTimerId);
        this.currentTimerId = 0;
        this.isTaskRunning = false;

        // If the task was killed we do not fast forward the progress animation.
        // Also a killed task will not have the needed duration saved, even if
        // the exitcode says the task finished gracefully. Some tasks override the
        // excitcode to display success even if it was killed (e.g webpack)
        if(this.taskWasKilled) {
            this.touchbar.finishRunningTask(false);
            this.currentTaskPlugin = "";
            this.currentTaskName = "";
            return;
        }

        // The time the task needed to finish
        let time = Date.now() - this.taskStartTime;

        // Save the duration only when the task was a success
        if(success) {
            let projectDirectory = new Directory(atom.project.getPaths()[0]);
            durationStore.setDuration(projectDirectory.getBaseName(), this.currentTaskPlugin, this.currentTaskName, time);
        }

        // And finally fast forward the task animation, if the task finished gracefully
        this.fastForwardTaskAnimation(() => {
            this.touchbar.finishRunningTask(success);
            this.currentTaskPlugin = "";
            this.currentTaskName = "";
        });
    }

    /**
     * Kill the currently running task
     * @return {undefined}
     */
    killTask() {
        this.taskWasKilled = true;
        this.plugins[this.currentTaskPlugin].killTask();
    }

    /**
     * Adds a line to the bottom panel at the bottom
     * @param {[type]} line [description]
     */
    addOutputLine(line) {
        this.atomPanelView.addOutputLine(line);
    }

}

export default TaskCollector;
