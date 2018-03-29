"use babel";

const remote = require("remote");
const {
    TouchBar
} = remote;
const {
    TouchBarButton,
    TouchBarPopover,
    TouchBarLabel
} = TouchBar;

const {
    Directory,
    File
} = require("atom");

/**
 * Touchbar class to interact with touchbar-setRegistry
 * and the mac touchbar
 */
class Touchbar {
    constructor(taskCallback) {
        this.touchbarRegistry = null; // Touchbar object which is provided by touchbar-registry
        this.currentTouchbarItems = []; // Holds all current touchbar items ( excluding items inside a popover )
        this.taskButtonReferences = {}; // References a task to a touchbar button to update the style
        this.tasks = {}; // Holds all tasks
        this.taskCallback = taskCallback; // Called when a task is clicked

        this.taskName = ""; // Current task name
        this.pluginName = ""; // Current pluginname for the executed task
        this.isInfinite = false; // Whether the task has an unknown runtime
        this.infiniteImageCount = 32; // Maximum count of images for the infinite progress loader
        this.currentInfiniteCounter = 0; // Holds the current image index for the infinite progress loader

        // Get asset folder path
        let packageDir = new Directory(atom.packages.getPackageDirPaths()[0]);
        this.assetsFolderPath = packageDir.getSubdirectory("touchbar-tasks").getSubdirectory("assets").getPath();
    }

    /**
     * Sets the touchbar registry
     * @param {object} touchbarRegistry Object which is provided by touchbar-registry. Used to update the touchbar
     */
    setRegistry(touchbarRegistry) {
        this.touchbarRegistry = touchbarRegistry;
    }

    /**
     * Sets the current task. Touchbar still needs to be updated with update()
     * @param {object} tasks A list of all available tasks in the following format:
     * {
     *      "taskrunner-name1": [],
     *      "taskrunner-name2": []
     * }
     */
    setTasks(tasks) {
        this.tasks = tasks;
    }

    /**
     * Updates the taskbar to display a running task.
     * @param  {string}  pluginName The name of the plugin to which the task belongs
     * @param  {string}  taskName   The taskname which was executed
     * @param  {Boolean} isInfinite Whether the task has an unknown duration
     * @return {undefined}
     */
    startRunningTask(pluginName, taskName, isInfinite) {
        this.taskName = taskName;
        this.pluginName = pluginName;
        this.isInfinite = isInfinite;
        this.currentInfiniteCounter = 0;
    }

    /**
     * Updates the taskbar to display the given progress of the previously started tasks.
     * Requires a call to startRunningTask before.
     * @param  {int} progress Progress in the range from 0 to 100
     * @return {undefined}
     */
    updateRunningTask(progress) {
        if (this.isInfinite) {
            this.currentInfiniteCounter += 1;
            this.currentInfiniteCounter %= this.infiniteImageCount;
            this.taskButtonReferences[this.pluginName][this.taskName].icon = this.assetPath("InfiniteLoader/"+this.currentInfiniteCounter+".png");
        } else {
            progress = Math.floor(progress);
            progress = Math.min(Math.max(progress, 0), 100);
            this.taskButtonReferences[this.pluginName][this.taskName].icon = this.assetPath("ProgressLoader/"+progress+".png");
        }
    }

    /**
     * Finishes the previously started task
     * @param  {Boolean} success Indicates whether the task was successfull or not
     * @return {undefined}
     */
    finishRunningTask(success) {
        if (success) {
            this.taskButtonReferences[this.pluginName][this.taskName].icon = this.assetPath("Icons/success.png");
        } else {
            this.taskButtonReferences[this.pluginName][this.taskName].icon = this.assetPath("Icons/error.png");
        }
    }

    /**
     * Updates the touchbar to display changes in the set tasks
     * @return {undefined}
     */
    update() {
        this._updateTasks();
    }

    /**
     * Updates the touchbar to display the currently set tasks,.
     * @return {undefined}
     */
    _updateTasks() {
        if (!this.touchbarRegistry) {
            return;
        }

        // cleanly remove all items currently available on the touchbar
        // which were created by us
        this.removeAllItems();

        // We need this function to create a closure around the parameters
        // otherwise the for loop will change them and the function will always
        // refer to the latest pluginName in the for loop.
        const generateClickFunction = (pluginName, taskName) => {
            return () => {
                this.taskCallback(pluginName, taskName);
            }
        };

        // Iterate over all plugins and their tasks
        let plugins = this.tasks;
        for (let pluginName in plugins) {
            if (!plugins.hasOwnProperty(pluginName)) {
                continue;
            }
            let plugin = plugins[pluginName];

            let tasks = [];

            this.taskButtonReferences[pluginName] = {};

            // Iterate over all tasks of a plugin and create a TouchBarButton
            // for each task
            plugin.forEach(taskName => {
                let item = new TouchBarButton({
                    label: taskName,
                    backgroundColor: "#313440",
                    iconPosition: "left",
                    click: generateClickFunction(pluginName, taskName)
                });
                tasks.push(item);
                this.taskButtonReferences[pluginName][taskName] = item;
            });

            // Create a TouchBarPopover and place all tasks for that plugin inside
            // it. This will basically act as a group.
            // Unfortunately, due to electrons limited support currently its not possible
            // to implement scrolling behaviour for that Popover. When a group of tasks exceeds
            // the touchbar width, they will be cut off.
            let taskContainer = new TouchBarPopover({
                label: pluginName,
                backgroundColor: "#313440",
                items: tasks
            });
            this.currentTouchbarItems.push(this.touchbarRegistry.addItem(taskContainer, 50));
        }
    }

    /**
     * Returns the path for the given asset. The passed path needs to be relative
     * to /assets without a leading slash
     * @param {string} path The absolute path to the asset
     */
    assetPath(path) {
        return this.assetsFolderPath + "/" + path;
    }

    /**
     * Removes all items from the touchbar.
     * @return {undefined}
     */
    removeAllItems() {
        this.currentTouchbarItems.forEach(itemId => {
            this.touchbarRegistry.removeItem(itemId);
        });
    }
}

export default Touchbar;
