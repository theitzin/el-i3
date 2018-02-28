// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const fs = require('fs');
const { exec } = require('child_process');
const i3 = require('i3').createClient();
const $ = require('jquery');

let current_window = require('electron').remote.getCurrentWindow();

let initialized = false;
let update_scheduled = false;
let taskbar_data = {};

update_taskbar = function(state, data=null) {
    if (state == 'init') {
        if (update_scheduled) {
            // avoid unnecessary i3 calls
            return;
        }
        update_scheduled = true;
        // first argument seems to always be null
        i3.tree((...args) => update_taskbar('exec', args[1]))
    }
    else if (state == 'exec') {
        update_scheduled = false;
        taskbar_data = {};
        let focused_id = -1;
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
            }
            monitor_data.workspaces = workspace_list;
            monitor_list.push(monitor_data);
        }
        taskbar_data.monitors = monitor_list;

        initialized = true;
        update_taskbar_window_focus(focused_id);
        show_taskbar();
    }
}

update_taskbar_workspace_focus = function(num, monitor) {
    if (update_scheduled || !initialized) {
        return;
    }

    taskbar_data.focused_workspace = null;
    for (let i = 0; i < taskbar_data.monitors.length; i++) {
        for (let j = 0; j < taskbar_data.monitors[i].workspaces.length; j++) {
            if (num == taskbar_data.monitors[i].workspaces[j].num) {
                taskbar_data.focused_workspace = taskbar_data.monitors[i].workspaces[j];
            }
        }
    }

    // empty workspace
    if (taskbar_data.workspace == null) {
        taskbar_data.focused_id = -1;
        taskbar_data.focused_workspace_num = num;
        taskbar_data.focused_monitor = monitor;
    }
    else {
        // if not empty then update is handled by window focus update
        return;
    }

    show_taskbar();
}

update_taskbar_window_focus = function(id) {
    if (update_scheduled || !initialized) {
        return;
    }

    for (let i = 0; i < taskbar_data.monitors.length; i++) {
        for (let j = 0; j < taskbar_data.monitors[i].workspaces.length; j++) {
            for (let k = 0; k < taskbar_data.monitors[i].workspaces[j].windows.length; k++) {
                win = taskbar_data.monitors[i].workspaces[j].windows[k];
                if (win.id == id) {
                    taskbar_data.focused_id = id;
                    taskbar_data.focused_workspace = taskbar_data.monitors[i].workspaces[j];
                    taskbar_data.focused_monitor = taskbar_data.monitors[i].name;
                }
            }
        }
    }

    show_taskbar();
}

get_icon_path = function(name) {
    try {
      fs.accessSync(`icons/papirus/${name}.svg`, fs.constants.R_OK);
        return `icons/papirus/${name}.svg`;
    } catch (err) {
        return `icons/papirus/xfce_unknown.svg`; // use as default icon
    }
}

show_taskbar = function() {
    if (!initialized) {
        update_taskbar('init');
        return;
    }

    let workspace = taskbar_data.focused_workspace;
    if (workspace) {
        let data = '';
        for (let i = 0; i < workspace.windows.length; i++) {
            let win = workspace.windows[i];
            let css_class = 'icon';
            if (win.id == taskbar_data.focused_id)
                css_class += ' icon_focused';

            data += `<img class="${css_class}" src="${get_icon_path(win.class.toLowerCase())}"/>`;
        }
        $('#data').html(data);
        current_window.setSize(workspace.windows.length * 100, 100);
    }
    else {
        $('#data').html('empty');
        current_window.setSize(100, 100);
    }
}

i3.on('workspace', function(e) {
    if (['empty', 'init'].includes(e.change)) {
        console.log('lsdf');
        update_taskbar_workspace_focus(e.current.num, );
    }
    if (['move'].includes(e.change)) {
        update_taskbar('init');
    }
});
i3.on('window', function(e) {
    if (['focus'].includese(e.change)) {
        update_taskbar_window_focus(e.container.window);
    }
    else if (['new', 'close', 'move'].includes(e.change)) {
        update_taskbar('init');
    }
});

// not needed, start of el-i3 triggers new window event anyway
// $(document).ready(function() {
//     update_taskbar();
// });
