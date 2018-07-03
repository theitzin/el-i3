const fs = require('fs');
const $ = require('jquery');

const base_module = require('./base_module');
const ht = require('./templates');

class Taskbar extends base_module.BaseModule {
	constructor(parent, core) {
		super(parent, core);

		this.wm_interface = core.wm_interface;
		this.wm_interface.on('update', (data) => this.update_apps(data));
	}

	get_icon_path(name) {
		try {
		  fs.accessSync(`icons/papirus/${name}.svg`, fs.constants.R_OK);
			return `icons/papirus/${name}.svg`;
		} catch (err) {
			return `icons/papirus/xfce_unknown.svg`; // use as default icon
		}
	}

	update_apps(data) {
		let workspace = data.focus.workspace;
		let display = data.focus.display.name;

		if (workspace) {
			let html = '';
			for (let win of workspace.windows) {
				if (!win.id || !win.class) {
					html += ht.taskbar_icon(
						this.get_default_icon_path(), -1, false, 1);	
				} else {
					let focused = win.id == data.focus.window.id;
					html += ht.taskbar_icon (
						this.get_icon_path(win.class.toLowerCase()), win.id, focused, 1);
				}
			}

			$(this.parent).html(html);

			for (let win of workspace.windows) {
				$('#' + win.id).click(e => {
					let id = e.target.id;
				});
				$('#' + win.id).contextmenu(e => {
					this.wm_interface.kill_window(e.target.id);			
				});
			}
		} else if ($.isEmptyObject(data.focus)) {
			// hopefully only happens during initialization
			return
		} else {
			$(this.parent).html('empty');
		}
	}
}

module.exports = {
	Taskbar : Taskbar
}