const fs = require('fs');
const { exec } = require('child_process');
const i3 = require('i3').createClient();
const $ = require('jquery');

const base_window = require('./window')

let current_window = require('electron').remote.getCurrentWindow();

class Statusbar extends base_window.BaseWindow {
    constructor() {
        super();
        this.initialized = false;
        this.update_scheduled = false;
        this.taskbar_data = {};

        i3.on('workspace', function(e) {
            if (['focus', 'empty', 'init'].includes(e.change)) {
                this.update_workspace_focus(e.current.num);
            }
            if (['move'].includes(e.change)) {
                this.update('init');
            }
        }.bind(this));
        i3.on('window', function(e) {
            if (['focus'].includes(e.change)) {
                this.update_window_focus(e.container.window);
            }
            else if (['new', 'close', 'move'].includes(e.change)) {
                this.update('init');
            }
        }.bind(this));

        // not needed, start of el-i3 triggers new window event anyway
        // $(document).ready(function() {
        //     taskbar.update();
        // }.bind(this));
    }
}

statusbar = new Statusbar();