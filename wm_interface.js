const i3 = require('i3').createClient();
const exec = require('child_process').exec;
const $ = require('jquery');
const events = require('events');

// should implement event 'update'
class WMInterface extends events.EventEmitter {
	constructor() {
		super();
	}
	
	move(num) { throw new Error('not implemented in base class'); }
	kill_window() { throw new Error('not implemented in base class'); }
	focus_window(id) {}
}

class i3Interface extends WMInterface {
	constructor() {
		super();

		this.tree = {};
		this.focus = {};
		this.previous_workspace = -1;
		this.await_focus_change = false;

		i3.on('workspace', (e) => {
			if (e.change == 'focus') {
				this.await_focus_change = true;
				setTimeout(() => this.await_focus_change = false, 500);
			}
			if (['empty', 'move', 'init'].includes(e.change)) {
				console.log('ws ' + e.change);
				this._update_tree(e);
			}
		});
		i3.on('window', (e) => {
			if (['focus', 'new', 'close', 'move'].includes(e.change)) {
				console.log('win ' + e.change);
				if (e.change == 'focus') {
					let con = this._dfs(e.container)[0];
					if (con.name == 'el-i3' && this.await_focus_change) {
						this.await_focus_change = false;
						setTimeout(() => i3.command('focus mode_toggle'), 100);
						// exec(`i3-msg 'focus mode_toggle'`);
						return
					}
				}
				this._update_tree(e);
			}
		});

		this.on('update', (data) => {
			if (data[1].workspace && this.previous_workspace) {
				if (data[1].workspace.num != this.previous_workspace) {
					this.move(data[1].workspace.num);
				}
				this.previous_workspace = data[1].workspace.num;
			}
		});

		setTimeout(() => {
			// for some reason this line crashes i3
			// i3.command(`[title="^el-i3$"] move scratchpad`);
			exec(`i3-msg '[title="^el-i3$"] sticky toggle'`);
			console.log('moved to scratchpad');
		}, 1000);
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

	kill_window(id) {
		i3.command(`[id="${id}"] kill`);
	}

	focus_window(id) {
		i3.command(`[id="${id}"] focus`);
	}

	_update_tree(e) {
		i3.tree((...args) => {
			// first argument seems to always be null
			this.tree = this._dfs(args[1], this._is_leaf, this._get_children, this._build_node)[0];
			this.focus = {};
			for (let output of this.tree.nodes) {
				if (output.focused) {
					this.focus.output = output;
					for (let workspace of output.nodes) {
						if (workspace.focused) {
							this.focus.workspace = workspace;
							for (let win of workspace.nodes) {
								if (win.focused) {
									this.focus.window = win;
								}
							}
						}
					}
				}
			}
			this.emit('update', [this.tree, this.focus]);
		});
	}

	_dfs(node) {
		if (this._is_leaf(node)) {
			return this._build_node(node, null);
		} else {
			let children = [];
			for (let child of this._get_children(node)) {
				children = children.concat(this._dfs(child));
			}
			return this._build_node(node, children);
		}
	}

	_is_leaf(node) {
		if (node.nodes.length != 0) {
			return false;
		} else {
			if (['con', 'workspace'].includes(node.type)) {
				return true;	
			} else {
				throw new Error(`unexpected leaf node type '${node.type}'`);				
			}
		}
	}

	_get_children(node) {
		if (['con', 'floating_con'].includes(node.type)) {
			return node.nodes;
		} else if (node.type == 'root') {
			return node.nodes.slice(1); // remove scratchpad
		} else if (node.type == 'output') {
			return node.nodes[1].nodes;
		} else if (node.type == 'workspace') {
			return node.nodes.concat(node.floating_nodes);
		} else {
			throw new Error(`unexpected type '${node.type}'`);
		}
	}

	_build_node(source_node, children) {
		// remove this tree layer
		if (children && ['con', 'floating_con'].includes(source_node.type)) {
			return children;
		}

		let node = {
			type : source_node.type
		};

		// add children
		if (!children) {
			// leaf node
		} else if (['root', 'output', 'workspace'].includes(source_node.type)) {
			node.nodes = children;
		} 

		// add properties
		if (source_node.type == 'output') {
			node.name = source_node.name;
		} else if (source_node.type == 'workspace') {
			node.num = source_node.num;
		} else if (['con', 'floating_con'].includes(source_node.type)) {
			node.name = source_node.name;
			node.id = source_node.window;
			if (!source_node.window) {
				node.class = null;
			} else {
				node.class = source_node.window_properties.class;
			}
		}
		node.focused = (node.nodes && node.nodes.some((c) => c.focused)) || source_node.focused;
		
		return [node];
	}
}

module.exports = {
    i3Interface : i3Interface
}