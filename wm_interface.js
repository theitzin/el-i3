const i3 = require('i3').createClient();
const exec = require('child_process').exec;
const $ = require('jquery');
const events = require('events');

// should implement event 'update'
class WMInterface extends events.EventEmitter {
	constructor() {
		super();
	}
	
	kill() { throw new Error('not implemented in base class'); }
	add_ready_check(promise) { throw new Error('not implemented in base class'); }
	move(num) { throw new Error('not implemented in base class'); }
	focus(id) {}
}

class i3Interface extends WMInterface {
	constructor() {
		super();

		this.tree = {
			focus : {},
			displays : []
		};
		this.previous_workspace = -1;
		// list of promises, only show on new workspace when all are ready
		this.ready_checks = [];

		i3.on('workspace', function(e) {
			if (['empty'].includes(e.change)) {
				this._update_workspace(e);
			}
			if (['move', 'init'].includes(e.change)) {
				this._update_tree(e);
			}
		}.bind(this));
		i3.on('window', function(e) {
			if (['focus'].includes(e.change)) {
				this._update_window(e);
			}
			if (['new', 'close', 'move'].includes(e.change)) {
				this._update_tree(e);
			}
		}.bind(this));

		this.on('update', (data) => {
			if (this.tree.focus.workspace && this.previous_workspace) {
				if (this.tree.focus.workspace.num != this.previous_workspace) {
					this.move(this.tree.focus.workspace.num);
				}
				this.previous_workspace = this.tree.focus.workspace.num;
			}
		});

		setTimeout(() => {
			// for some reason this line crashes i3
			// i3.command(`[title="^el-i3$"] move scratchpad`);
			// exec(`i3-msg '[title="^el-i3$"] move scratchpad'`);
			exec(`i3-msg '[title="^el-i3$"] sticky toggle'`);
			console.log('moved to scratchpad');
		}, 1000);
	}

	kill(id) {
		i3.command(`[id="${id}"] kill`);
	}

	add_ready_check(promise) {
		this.ready_checks.push(promise);
	}

	move(num) {
		// if (this.ready_checks.length == 0) {
		// setTimeout(() => i3.command(`scratchpad show`), 100);
		// i3.command(`scratchpad show`);
		// } else {
		// 	exec(`i3-msg '[title="^el-i3$"] move scratchpad'`)
		// 		.then(() => Promise.all(this.ready_checks)
		// 		.then(() => i3.command(`scratchpad show`)
		// 	));
		// }
	}

	focus(id) {
		i3.command(`[id="${id}"] focus`);
	}

	_get_display(node, focus) {
		let data = {};
		let focused = node.nodes[1].focused;

		data.name = node.name;
		data.workspaces = [];
		for (let workspace of node.nodes[1].nodes) {
			let workspace_data = this._get_workspace(workspace, data, focus);
			data.workspaces.push(workspace_data.data);

			if (workspace_data.focused) {
				focused = true;
			}
		}

		if (focused) {
			focus.display = data;
		}
		
		return {
			data : data,
			focused : focused
		};
	}

	_get_workspace(node, parent, focus) {
		let data = {};
		let focused = node.focused

		data.num = node.num;
		data.windows = [];
		for (let win of node.nodes) {
			let window_data = this._get_window(win, data, focus);
			data.windows.push(window_data.data);

			if (window_data.focused) {
				focused = true;
			}
		}
		
		if (focused) {
			focus.workspace = data;
		}

		return {
			data : data,
			focused : focused
		};
	}

	_get_window(node, parent, focus) {
		let data = {};
		let focused = node.focused;

		data.id = node.window;
		data.title = node.name;
		if (!data.id) {
			data.class = null;
		} else {
			data.class = node.window_properties.class;
		}
		
		if (focused) {
			focus.window = data;
		}

		return {
			data : data,
			focused : focused
		};
	}

	_update_tree(e) {
		i3.tree((...args) => {
			// first argument seems to always be null
			let data = args[1];
			console.log(data);

			let tree = {};
			tree.focus = {};
			tree.displays = [];
			for (let display of data.nodes) {
				if (display.name == '__i3') {
					continue
				}

				let display_data = this._get_display(display, tree.focus);
				tree.displays.push(display_data.data);
			}

			// no workspace seems to be focused after 'close'
			// manually set previous workspace
			if (e && e.change == 'close') {
				for (let display of tree.displays) {
					for (let workspace of display.workspaces) {
						if (workspace.num == this.tree.focus.workspace.num) {
							tree.focus.workspace = workspace;
							tree.focus.display = display;
						}
					}
				}
			}

			this.tree = tree;
			this.emit('update', this.tree);
		});
	}

	_update_workspace(e) {
		if (this.tree.displays.length == 0) {
			this._update_tree();
			return
		}

		for (let display of this.tree.displays) {
			for (let i = 0; i < display.workspaces.length; i++) {
				let workspace = display.workspaces[i];
				if (e.old && workspace.num == e.old.num) {
					display.workspaces[i] = this._get_workspace(e.old, display, this.tree.focus).data;
				} 
				if (workspace.num == e.current.num) {
					if (e.change != 'focus') {
						workspace = this._get_workspace(e.current, display, this.tree.focus).data;
					}
					display.workspaces[i] = workspace;
					this.tree.focus.window = null;
					this.tree.focus.workspace = workspace;
					this.tree.focus.display = display;
				}
			}
		}

		this.emit('update', this.tree);
	}

	_update_window(e) {
		if (this.tree.displays.length == 0) {
			this._update_tree();
			return
		}

		for (let display of this.tree.displays) {
			for (let workspace of display.workspaces) {
				for (let i = 0; i < workspace.windows.length; i++) {
					let win = workspace.windows[i];
					if (win.id == e.container.window) {
						this.tree.focus.window = win;
						this.tree.focus.workspace = workspace;
						this.tree.focus.display = display;
					}
				}
			}
		}

		this.emit('update', this.tree);
	}
}

module.exports = {
    i3Interface : i3Interface
}