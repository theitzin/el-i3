const i3 = require('i3').createClient();
const events = require('events');

// should implement event 'update'
class Interface extends events.EventEmitter {
	constructor() {
		super();
	}
	
	// get_tree() { throw new Error('not implemented in base class'); }
}

class i3Interface extends Interface {
	constructor() {
		super();

		this.tree = {};

		i3.on('workspace', function(e) {
			if (['focus', 'empty', 'init'].includes(e.change)) {
				this.update_workspace(e.current.num);
			}
			if (['move'].includes(e.change)) {
				this.update_all();
			}
		}.bind(this));
		i3.on('window', function(e) {
			if (['focus'].includes(e.change)) {
				this.update_window(e.container.window);
			}
			else if (['new', 'close', 'move'].includes(e.change)) {
				this.update_all();
			}
		}.bind(this));
	}

	get_tree() {
		return this.tree;
	}

	update_all() {
		return new Promise((resolve, reject) => {
			i3.tree((...args) => {
				// first argument seems to always be null
				let data = args[1];

				let focused_id = null;
				let focused_workspace = null;
				let focused_monitor = '';

				let taskbar_data = {};
				let monitor_list = [];
				for (let monitor_node of data.nodes) {
					if (monitor_node.name == '__i3') {
						continue
					}
					let monitor = monitor_node.nodes[1]; // 1 is 'content' node
					let monitor_data = {};
					monitor_data.name = monitor_node.name;
					let workspace_list = [];
					for (let workspace of monitor.nodes) {
						let workspace_data = {};
						workspace_data.num = workspace.num;
						let window_list = [];
						for (let win of workspace.nodes) {
							let window_data = {};							
							window_data.id = win.window;
							window_data.title = win.name;
							if (!window_data.id) {
								window_data.class = null;
							} else {
								window_data.class = win.window_properties.class;
							}
							window_list.push(window_data);

							if (win.focused) {
								focused_id = window_data.id;
							}
						}
						workspace_data.windows = window_list;
						workspace_list.push(workspace_data);

						if (workspace.focused) {
							focused_workspace = workspace;
							focused_monitor = monitor_node.name;
						}
					}
					monitor_data.workspaces = workspace_list;
					monitor_list.push(monitor_data);
				}
				taskbar_data.monitors = monitor_list;
				taskbar_data.focused_id = focused_id;
				taskbar_data.focused_workspace = focused_workspace;
				taskbar_data.focused_monitor = focused_monitor;

				resolve(taskbar_data)
			});
		});
	}

	update_workspace(e) {

	}

	update_window(e) {

	}
}

module.exports = {
    i3Interface : i3Interface
}