"use babel";

const storage = require('electron-json-storage');

/**
 * Stores the duration of tasks on the disk. Uses the electron-json-storage package
 */
class DurationStore {
    constructor() {
        this.data = {};
        storage.get("durationData", (error, data) => {
            if(error) {
                throw error;
            }
            this.data = data;
        });
    }

    /**
     * Retrieves the duration for a task/plugin/project combination
     * @param  {string} projectName The name of the project
     * @param  {string} pluginName  The name of the plugin
     * @param  {string} taskName    The name of the task
     * @return {undefined}
     */
    getDuration(projectName, pluginName, taskName) {
        // If the path exists inside the object, retrieve the duration.
        if(this.data && this.data[projectName] && this.data[projectName][pluginName] && this.data[projectName][pluginName][taskName]) {
            return this.data[projectName][pluginName][taskName];
        }
        return null;
    }

    setDuration(projectName, pluginName, taskName, duration) {
        // Create the path to the duration

        // Theres a possibility that another atom instance changed the file since we last
        // read the contents. So we just reread it, change the contents and save it again.
        storage.get("durationData", (error, data) => {
            if(error) {
                throw error;
            }
            this.data = data;
            this.data[projectName] = this.data[projectName] || {};
            this.data[projectName][pluginName] = this.data[projectName][pluginName] || {};
            this.data[projectName][pluginName][taskName] = duration;
            storage.set("durationData", this.data);
        });
    }

}

let durationStore = new DurationStore;

export default durationStore;
