"use babel";

import {
    CompositeDisposable
} from "atom";

export default {

    atomPanelView: null, // Holds the panel at the bottom where process output will be displayed
    statusBarTile: null, // The button to toggle the atomPanelView
    taskCollector: null, // Class to run / kill / collect tasks from all plugins
    touchbarRegistry: null, // Holds the instance provided by touchbar-registry to share the touchbar with other plugins
    projectPathSubscription: null, // Listener to update the tasks upon project change

    /**
     * Package entry. Will be called by atom upon package activation
     * @param  {object} state JSON Object which can be set by the plugin upon exit
     *                        from which a previous point can be restored
     * @return {undefined}
     */
    activate(state) {
        this.projectPathSubscription = atom.project.onDidChangePaths(this.updateTasks.bind(this));
    },

    /**
     * Called by atom upon package destruction
     * @return {undefined}
     */
    deactivate() {
        this.projectPathSubscription.dispose();
        if(this.statusBarTile) {
            this.statusBarTile.destroy();
        }
    },

    /**
     * Collects all tasks from plugins and updates the touchbar
     * @return {undefined}
     */
    updateTasks() {
        this.touchbar.setTasks(this.taskCollector.getTasks());
        this.touchbar.update();
    },

    /**
     * Called by service touchbar-registry
     * @param  {object} touchbarRegistry Touchbar instance provided by touchbar-registry
     * @return {undefined}
     */
    consumeTouchBar(touchbarRegistry) {
        // We don't want to block the main event loop
        // therefore we are going to set a timer
        // to initialize our touchbar and tasks asynchronously
        setTimeout(() => {
            let TaskCollector = require("./TaskCollector.js");
            let Touchbar = require("./Touchbar.js");
            let AtomPanelView = require("./AtomPanelView.js");

            this.atomPanelView = new AtomPanelView();
            this.taskCollector = new TaskCollector(this.atomPanelView);
            this.touchbar = new Touchbar(this.taskCollector.runTask.bind(this.taskCollector));
            this.taskCollector.setTouchbar(this.touchbar);

            this.touchbar.setRegistry(touchbarRegistry);
            this.updateTasks();
            this.touchbar.update();
        }, 1);
    },

    /**
     * Called by service statusbar
     * @param  {object} statusBar Statusbar object provided by statusbar
     * @return {undefined}
     */
    consumeStatusBar(statusBar) {
        let element = document.createElement("div");
        element.classList.add("touchbar-tasks-status-bar");
        element.innerHTML = "Touchbar Runner";
        element.onclick = this.toggleStatusBar.bind(this);
        this.statusBarTile = statusBar.addLeftTile({item: element});
    },

    /**
     * Called when the statusbar button is clicked.
     * Toggles the bottom atompanel where process output is displayed
     * @return {undefined}
     */
    toggleStatusBar() {
        if(this.statusBarTile.item.classList.contains("active")) {
            this.atomPanelView.hide();
            this.statusBarTile.item.classList.remove("active");
        } else {
            this.atomPanelView.show();
            this.statusBarTile.item.classList.add("active");
        }
    },

    /**
     * Can be used to save package data.
     * @return {object} Data which will be passed back to the plugin upon activation
     */
    serialize() {
        return {};
    },
};
