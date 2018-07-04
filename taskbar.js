const fs = require('fs');
const $ = require('jquery');

const base_module = require('./base_module');
const ht = require('./templates');

class Taskbar extends base_module.BaseModule {
	constructor(parent, core) {
		super(parent, core);

		this.wm_interface = core.wm_interface;
		this.wm_interface.on('update', (data) => this.update(data));
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

	add_workspace(data, workspace, numbered) {
		let html = '';
		for (let win of workspace.windows) {
			if (win.id && win.class) {
				let focused = Boolean(data.focus.window && (win.id == data.focus.window.id));
				html += ht.taskbar_icon (
					this.get_icon_path(win.class.toLowerCase()), win.id, focused, 1);
			} else {
				html += ht.taskbar_icon(
					this.get_default_icon_path(), -1, false, 1);	
			}
		}

		$(this.parent).append(ht.taskbar_container(workspace.num, numbered));
		$(`#workspace${workspace.num} > .workspace_wrapper_num`).html(workspace.num);
		$(`#workspace${workspace.num} > .workspace_wrapper_icons`).html(html);
		$(`#workspace${workspace.num} .icon`).click(e => this.wm_interface.focus(e.target.id));
		$(`#workspace${workspace.num} .icon`).contextmenu(e => this.wm_interface.kill(e.target.id));		
	}

	update(data) {
		$(this.parent).html('');
		let extended = true;

		if (extended) {
			let workspaces = [];
			for (let display of data.displays) {
				for (let workspace of display.workspaces) {
					if (workspace.windows.length != 0) {
						workspaces.push(workspace);
					}
				}
			}
			workspaces = workspaces.sort((x, y) => x.num > y.num);
			for (let workspace of workspaces) {
				this.add_workspace(data, workspace, true);
			}
		} else if (data.focus.workspace) {
			this.add_workspace(data, data.focus.workspace, false)
		} else {
			$(this.parent).html('no data');
		}

		this.core.update_window();
	}
}

module.exports = {
	Taskbar : Taskbar
}