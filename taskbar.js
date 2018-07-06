const fs = require('fs');
const $ = require('jquery');

const base_module = require('./base_module');
const ht = require('./templates');

class Taskbar extends base_module.BaseModule {
	constructor(parent, core) {
		super(parent, core);

		this.wm_interface = core.wm_interface;
		this.wm_interface.on('update', (data) => this.update(data[0], data[1]));
	}

	get_icon_path(name) {
		try {
		  fs.accessSync(`icons/papirus/${name}.svg`, fs.constants.R_OK);
			return `icons/papirus/${name}.svg`;
		} catch (err) {
			return `icons/papirus/xfce_unknown.svg`; // use as default icon
		}
	}

	get_default_icon_path() {
		return `icons/papirus/xfce_unknown.svg`;
	}

	add_workspace(focus, workspace, numbered) {
		let html = '';
		let wd_id = 'workspace' + workspace.num;

		for (let win of workspace.nodes) {
			if (win.name == 'el-i3') {
				continue
			}
			if (win.id && win.class) {
				let focused = Boolean(focus.window && (win.id == focus.window.id));
				html += ht.taskbar_icon (
					this.get_icon_path(win.class.toLowerCase()), win.id, focused, 1);
			} else {
				html += ht.taskbar_icon(
					this.get_default_icon_path(), -1, false, 1);	
			}
		}

		$(this.parent).append(ht.taskbar_container(workspace.num, numbered));
		$(`#${wd_id} > .workspace_wrapper_icons`).html(html);
		$(`#${wd_id} .icon`).click(e => this.wm_interface.focus_window(e.target.id));
		$(`#${wd_id} .icon`).contextmenu(e => this.wm_interface.kill_window(e.target.id));		
	}

	update(tree, focus) {
		$(this.parent).html('');
		let extended = true;

		if (extended) {
			let workspaces = [];
			for (let output of tree.nodes) {
				for (let workspace of output.nodes) {
					if (workspace.nodes.length != 0) {
						workspaces.push(workspace);
					}
				}
			}
			workspaces = workspaces.sort((x, y) => x.num > y.num);
			for (let workspace of workspaces) {
				this.add_workspace(focus, workspace, true);
			}
		} else if (focus.workspace) {
			this.add_workspace(focus, focus.workspace, false)
		} else {
			$(this.parent).html('no data');
		}

		this.core.update_window();
	}
}

module.exports = {
	Taskbar : Taskbar
}