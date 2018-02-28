const fs = require('fs');
const { exec } = require('child_process');
const i3 = require('i3').createClient();
const $ = require('jquery');

const base_window = require('./window')

let current_window = require('electron').remote.getCurrentWindow();

class Statusbar extends base_window.BaseWindow {
    constructor(parent) {
        super(parent);

        this.set_position(false, true, 100, 0);

        this.update();   
    }

    update() {
        this.set_content(`#${this.parent}`, '<div id="status">empty</div>')
    }
}

statusbar = new Statusbar('statusbar');