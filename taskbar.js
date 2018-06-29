const fs = require('fs');
const $ = require('jquery');

const base_window = require('./window')
const wm_interface = require('./interface')
const html_templates = require('./templates')

class Taskbar extends base_window.BaseWindow {
	constructor(parent) {
		super(parent);

		this.interface = new wm_interface.i3Interface();
		this.interface.on('update', (data) => this.update_apps(data));
		setInterval(() => this.update_info(), 1000); // call every second

		this.set_position(false, false, 100, 0);
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
					html += html_templates.taskbar_icon(
						this.get_default_icon_path(), -1, false, 1);	
				} else {
					let focused = win.id == data.focus.window.id;
					html += html_templates.taskbar_icon (
						this.get_icon_path(win.class.toLowerCase()), win.id, focused, 1);
				}
			}
			this.interface.move(workspace.num);
			this.set_content('#app_container', html, display);

			for (let win of workspace.windows) {
				$(`#${win.id}`).click(e => {
					let id = e.target.id;
				});
				$(`#${win.id}`).contextmenu(e => {
					this.interface.kill_window(e.target.id);			
				});
			}
		} else if ($.isEmptyObject(data.focus)) {
			// hopefully only happens during initialization
			return
		} else {
			this.set_content('#app_container', 'empty', display);
		}
	}

	update_info() {
		let date = new Date().toISOString(). 	// formatted as '2012-11-04T14:51:06.157Z'
		  	replace(/T/, ' ').      			// replace T with a space
		  	replace(/\..+/, '');    			// delete the dot and everything after

		this.set_content('#info_container', date);
	}
}

taskbar = new Taskbar('taskbar');