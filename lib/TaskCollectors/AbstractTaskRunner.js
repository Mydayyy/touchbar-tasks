'use babel';

/**
 * AbstractTaskRunner from which all plugins should inherit.
 * The plugin needs to implement all methods provided.
 */
class AbstractTaskRunner {

    constructor(taskCollector) {
        this.taskCollector = taskCollector;
    }

    getName() {
        throw Error("getName is not implemented");
    }

    getTasks() {
        throw Error("getTasks is not implemented");
    }

    runTask() {
        throw Error("runTask is not implemented");
    }

    killTask() {
        throw Error("killTask is not implemented");
    }
}

export default AbstractTaskRunner;