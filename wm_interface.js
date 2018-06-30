const i3 = require('i3').createClient();
const $ = require('jquery');
const events = require('events');

// should implement event 'update'
class WMInterface extends events.EventEmitter {
	constructor() {
		super();
	}
	
	kill_window() { throw new Error('not implemented in base class'); }
	move(num) { throw new Error('not implemented in base class'); }
	// get_tree() { throw new Error('not implemented in base class'); }
}

class i3Interface extends WMInterface {
	constructor() {
		super();

		this.tree = {
			focus : {},
			displays : []
		};
		this.window_id = null;

		i3.on('workspace', function(e) {
			// ['focus']
			if (['empty', 'init'].includes(e.change)) {
				if (this._filter_events(e)) 
					this._update_workspace(e);
			}
			if (['move'].includes(e.change)) {
				if (this._filter_events(e)) 
					this._update_tree();
			}
		}.bind(this));
		i3.on('window', function(e) {
			if (['focus'].includes(e.change)) {
				if (this._filter_events(e)) 
					this._update_window(e);
			}
			if (['new', 'close', 'move'].includes(e.change)) {
				if (this._filter_events(e))
					this._update_tree();
			}
		}.bind(this));
	}

	kill_window(id) {
		i3.command(`[id="${id}"] kill`);
	}

	move(num) {
		if (this.window_id) {
			i3.command(`[id="${this.window_id}"] move container to workspace number ${num}`);
		}
	}

	get_tree() {
		return this.tree;
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

	_update_tree() {
		i3.tree((...args) => {
			// first argument seems to always be null
			let data = args[1];

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

			// workaround. sometimes nothing seems to be focused.
			// only update focused information if new data is available. 
			// this might result in things showing as focused even if they are not.
			// is there a better solution?
			this.tree.focus = Object.assign(this.tree.focus, tree.focus);
			this.tree.displays = tree.displays;

			this.emit('update', this.tree)
		});
	}

	_update_workspace(e) {
		if ($.isEmptyObject(this.tree.focus) || this.tree.displays.length == 0) {
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
					this.tree.focus.workspace = workspace;
					this.tree.focus.display = display;
				}
			}
		}

		this.emit('update', this.tree)
	}

	_update_window(e) {
		if ($.isEmptyObject(this.tree.focus) || this.tree.displays.length == 0) {
			return
		}

		for (let display of this.tree.displays) {
			for (let workspace of display.workspaces) {
				for (let i = 0; i < workspace.windows.length; i++) {
					let win = workspace.windows[i];
					if (win.id == e.container.window) {
						if (e.change != 'focus') {
							win = this._get_window(e.container, workspace, this.tree.focus).data;
							workspace.windows[i] = win;
						}
						this.tree.focus.window = win;
						this.tree.focus.workspace = workspace;
						this.tree.focus.display = display;
					}
				}
			}
		}

		this.emit('update', this.tree)
	}

	_filter_events(e) {
		return true;

		// let blacklist = ['el-i3'];
		// let properties = ['e.container.name', 'e.container.nodes[0].name'];

		// for (let p of properties) {
		// 	try {
		// 		let eval_p = eval(p);
		// 		if (blacklist.includes(eval_p)) {
		// 			return false;
		// 		}
		// 	} catch (err) {}
		// }
		
		// return true;
	}
}

module.exports = {
    i3Interface : i3Interface
}