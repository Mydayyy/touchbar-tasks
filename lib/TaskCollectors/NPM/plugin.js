'use babel';

const {
    File,
    Directory
} = require("atom");

const fs = require("fs");

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
        return "NPM";
    }

    getTasks() {
        let projectDirectory = new Directory(atom.project.getPaths()[0]);
        let file = projectDirectory.getFile("package.json");

        if (!file.existsSync()) {
            return [];
        }

        let fileContent = null;
        try {
            fileContent = fs.readFileSync(file.getPath(), "utf8");
        } catch(e) {
            return [];
        }

        let json = null;
        try {
            json = JSON.parse(fileContent);
        } catch (err) {
            return [];
        }
        if (json.hasOwnProperty("scripts")) {
            return Object.keys(json.scripts);
        }

        return [];
    }

    runTask(taskName) {
        this.process = new BufferedProcess({
            command: "npm",
            args: ["run", taskName],
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
