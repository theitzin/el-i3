class Interface {}


class i3Interface extends Interface {
	constructor() {

	}

	update() {
		return new Promise((resolve, reject) => {
			i3.tree((...args) => {
				// first argument seems to always be null
				data = args[1];

				let focused_id = null;
				let focused_workspace_num = null;
				let focused_monitor = '';

				taskbar_data = {};
				let monitor_list = [];
				for (let monitor_node of data.nodes) {
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
							focused_monitor = monitor_node.name;
						}
					}
					monitor_data.workspaces = workspace_list;
					monitor_list.push(monitor_data);
				}
				taskbar_data.monitors = monitor_list;

				resolve(taskbar_data)
			});
		});
	}
}