'use babel';

const {
    File,
    Directory
} = require("atom");

const fs = require("fs");
const path = require("path");

import {
    BufferedProcess
} from "atom";

import AbstractTaskRunner from "../AbstractPlugin.js";

class TaskRunner extends AbstractTaskRunner {

    constructor() {
        super(...arguments);

        this.process = null;
    }

    getName() {
        return "Grunt";
    }

    getTasks() {
        let grunt = null;
        try {
            grunt = require("grunt");
        } catch(e) {
            return [];
        }

        let projectDirectory = new Directory(atom.project.getPaths()[0]);
        let file = projectDirectory.getFile("Gruntfile.js"); // TODO: Add possible gruntfile paths

        let gruntFile = null;
        try {
            process.chdir(path.dirname(file.getPath()));
            gruntFile = require(file.getPath());
        } catch(e) {
            return [];
        }

        gruntFile(grunt);

        let tasks = [];
        let ref = grunt.task._tasks;
        for(let task in ref) {
            if(!ref.hasOwnProperty(task)) {
                continue;
            }
            if(Object.keys(ref[task].meta).length > 0) {
                continue;
            }

            tasks.push(task);
        }

        return tasks;
    }

    runTask(taskName) {
        this.process = new BufferedProcess({
            command: "grunt",
            args: [taskName],
            options: {
                cwd: atom.project.getPaths()[0]
            },
            stdout: out => {
                this.taskCollector.addOutputLine(out);
            },
            exit: exitCode => {
                this.taskCollector.finishedTask(exitCode === 0);
            }
        });
    }

    killTask() {
        this.process.kill();
        this.taskCollector.finishedTask(false);

    }
}

export default TaskRunner;
