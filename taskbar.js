const fs = require('fs');
const { exec } = require('child_process');
const i3 = require('i3').createClient();
const $ = require('jquery');

const base_window = require('./window')

let current_window = require('electron').remote.getCurrentWindow();

class Taskbar extends base_window.BaseWindow {
    constructor(parent) {
        super(parent);
        this.initialized = false;
        this.update_scheduled = false;
        this.taskbar_data = {};

        this.set_position(false, false, 100, 0);

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

        this.update('init');
    }

    update(state, data=null) {
        if (state == 'init') {
            if (this.update_scheduled) {
                // avoid unnecessary i3 calls
                return;
            }
            this.update_scheduled = true;
            // first argument seems to always be null
            i3.tree((...args) => this.update('exec', args[1]))
        }
        else if (state == 'exec') {
            this.update_scheduled = false;
            let last_workspace_num = this.taskbar_data.focused_workspace_num;
            let last_monitor = this.taskbar_data.focused_monitor;
            let focused_id = -1;
            let focused_workspace_num = -1;
            let focused_monitor = '';
            this.taskbar_data = {};
            let monitor_list = [];
            for (let i = 1; i < data.nodes.length; i++) {
                let monitor = data.nodes[i].nodes[1]; // 1 is 'content' node
                let monitor_data = {};
                monitor_data.name = data.nodes[i].name;
                let workspace_list = [];
                for (let j = 0; j < monitor.nodes.length; j++) {
                    let workspace = monitor.nodes[j];
                    let workspace_data = {};
                    workspace_data.num = workspace.num;
                    let window_list = [];
                    for (let k = 0; k < workspace.nodes.length; k++) {
                        let win = workspace.nodes[k];
                        let window_data = {};
                        window_data.class = win.window_properties.class;
                        window_data.id = win.window;
                        window_data.title = win.name;
                        window_list.push(window_data);

                        if (win.focused) {
                            focused_id = window_data.id;
                        }
                    }
                    workspace_data.windows = window_list;
                    workspace_list.push(workspace_data);

                    if (workspace.focused) {
                        focused_workspace_num = workspace.num;
                        focused_monitor = data.nodes[i].name;
                    }
                }
                monitor_data.workspaces = workspace_list;
                monitor_list.push(monitor_data);
            }
            this.taskbar_data.monitors = monitor_list;

            this.initialized = true;
            if (focused_id != -1) {
                this.update_window_focus(focused_id);
            }
            // else if (focused_workspace_num != -1) {
            //     this.update_workspace_focus(focused_workspace_num, focused_monitor);
            // }
            else {
                this.update_workspace_focus(last_workspace_num, last_monitor);
            }
        }
    }

    update_workspace_focus(num, monitor=null) {
        if (this.update_scheduled || !this.initialized) {
            return;
        }

        this.taskbar_data.focused_workspace = null;
        for (let i = 0; i < this.taskbar_data.monitors.length; i++) {
            for (let j = 0; j < this.taskbar_data.monitors[i].workspaces.length; j++) {
                if (num == this.taskbar_data.monitors[i].workspaces[j].num 
                    && this.taskbar_data.monitors[i].workspaces[j].windows.length != 0) {
                    this.taskbar_data.focused_workspace = this.taskbar_data.monitors[i].workspaces[j];
                }
            }
        }

        // empty workspace
        if (this.taskbar_data.focused_workspace == null) {
            this.taskbar_data.focused_id = -1;
            this.taskbar_data.focused_workspace_num = num;
            if (monitor) {
                this.taskbar_data.focused_monitor = monitor;
            }
        }
        else {
            // if not empty then update is handled by window focus update
            //return;
        }

        this.show();
    }

    update_window_focus(id) {
        if (this.update_scheduled || !this.initialized) {
            return;
        }

        for (let i = 0; i < this.taskbar_data.monitors.length; i++) {
            for (let j = 0; j < this.taskbar_data.monitors[i].workspaces.length; j++) {
                for (let k = 0; k < this.taskbar_data.monitors[i].workspaces[j].windows.length; k++) {
                    let win = this.taskbar_data.monitors[i].workspaces[j].windows[k];
                    if (win.id == id) {
                        this.taskbar_data.focused_id = id;
                        this.taskbar_data.focused_workspace = this.taskbar_data.monitors[i].workspaces[j];
                        this.taskbar_data.focused_workspace_num = this.taskbar_data.monitors[i].workspaces[j].num;
                        this.taskbar_data.focused_monitor = this.taskbar_data.monitors[i].name;
                    }
                }
            }
        }

        this.show();
    }

    get_icon_path(name) {
        try {
          fs.accessSync(`icons/papirus/${name}.svg`, fs.constants.R_OK);
            return `icons/papirus/${name}.svg`;
        } catch (err) {
            return `icons/papirus/xfce_unknown.svg`; // use as default icon
        }
    }

    show() {
        if (!this.initialized) {
            this.update('init');
            return;
        }

        let workspace = this.taskbar_data.focused_workspace;
        if (workspace) {
            let data = '';
            for (let i = 0; i < workspace.windows.length; i++) {
                let win = workspace.windows[i];
                let focused = win.id == this.taskbar_data.focused_id;

                data += `<div class="img_wrapper ${focused ? 'img_wrapper_focused' : ''}"><img
                    id="${win.id}" 
                    class="icon ${focused ? 'icon_focused' : ''}" 
                    src="${this.get_icon_path(win.class.toLowerCase())}"/></div>`;
            }
            this.set_content(`#${this.parent}`, data);
            for (let i = 0; i < workspace.windows.length; i++) {
                let win = workspace.windows[i];

                // left click event
                $(`#${win.id}`).click(this.left_click_event);
                // right click event
                $(`#${win.id}`).contextmenu(this.right_click_event);
            }
        }
        else {
            this.set_content(`#${this.parent}`, 'empty');
        }
    }

    left_click_event(e) {
        let id = e.target.id;
    }

    right_click_event(e) {
        i3.command(`[id="${e.target.id}"] kill`);
    }
}

taskbar = new Taskbar('taskbar');