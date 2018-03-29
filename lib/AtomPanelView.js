"use babel";

export default class AtomPanelView {

    bottomPanel: null;

    constructor(serializedState) {
        this.element = document.createElement("div");
        this.element.classList.add("touchbar-tasks");

        this.bottomPanel = atom.workspace.addBottomPanel({
            item: this.getElement(),
            visible: false
        });
    }

    serialize() {}

    /**
     * Shows the panel
     * @return {undefined}
     */
    show() {
        this.bottomPanel.show();
    }

    /**
     * Hides the panel
     * @return {undefined}
     */
    hide() {
        this.bottomPanel.hide();
    }

    /**
     * Removes the panel from the DOM
     * @return {undefined}
     */
    destroy() {
        this.element.remove();
    }

    /**
     * Adds a line to the panel. When we are scrolled to the bottom we enable autoscroll
     * @param {[type]} content [description]
     */
    addOutputLine(content) {
        // Check whether we are scrolled to the bottom
        let scroll = this.element.scrollTop === this.element.scrollHeight - this.element.clientHeight;

        // Create the elment and append it
        const line = document.createElement("pre");
        line.classList.add("line");
        line.innerHTML = content;
        this.element.appendChild(line);

        // When we were scrolled to the bottom before appending to the element,
        // scroll to the bottom again
        if(scroll) {
            this.element.scrollTop = this.element.scrollHeight;
        }
    }

    /**
     * Clears the content of the element
     * @return {undefined}
     */
    clear() {
        this.element.innerHTML = "";
    }

    /**
     * Returns the dom element
     * @return {undefined}
     */
    getElement() {
        return this.element;
    }

}
