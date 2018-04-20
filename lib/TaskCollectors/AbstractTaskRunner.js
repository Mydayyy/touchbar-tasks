'use babel';

/**
 * AbstractTaskRunner from which all plugins should inherit.
 * The plugin needs to implement all methods provided.
 */
class AbstractTaskRunner {
    constructor(taskCollector) {
        if(new.target === AbstractTaskRunner) {
            throw Error("Cannot construct abstract class. Please use a derived taskrunner");
        }
        this.taskCollector = taskCollector;
    }

    /**
     * Called by the TaskCollector to decide the TaskRunners name.
     * @return {String} name
     */
    getName() {
        throw Error("getName is not implemented");
    }

    /**
     * Called by the TaskCollector to retrieve a list of available tasks
     * The return format should be a list of strings
     * @return {Array} List of available tasks
     */
    getTasks() {
        throw Error("getTasks is not implemented");
    }

    /**
     * Called by the TaskCollector to start the task with the given name.
     * The ending of the task needs to be signaled with
     * this.taskCollector.finishedTask(result);
     * @param  {[type]} taskName [description]
     * @return {[type]}          [description]
     */
    runTask(taskName) {
        throw Error("runTask is not implemented");
    }

    /**
     * Called by the taskCollector to kill the currently running task.
     * You should call this.taskCollector.finishedTask(false) after the
     * task got terminated.
     * @return {[type]} [description]
     */
    killTask() {
        throw Error("killTask is not implemented");
    }
}

export default AbstractTaskRunner;
