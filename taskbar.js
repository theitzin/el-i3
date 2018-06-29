const fs = require('fs');
const $ = require('jquery');
const { exec } = require('child_process');

const base_window = require('./window')
const wm_interface = require('./interface')
const html_templates = require('./templates')

class Taskbar extends base_window.BaseWindow {
	constructor(parent) {
		super(parent);

		this.interface = new wm_interface.i3Interface();
		this.interface.on('update', (data) => this.update_apps(data));
		// setInterval(() => this.update_info(), 1000); // call every second
		this.update_info(); // once - testing
		this.initialize_info();

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

			$('#app_container').html(html);

			for (let win of workspace.windows) {
				$(`#${win.id}`).click(e => {
					let id = e.target.id;
				});
				$(`#${win.id}`).contextmenu(e => {
					this.interface.kill_window(e.target.id);			
				});
			}

			this.interface.move(workspace.num);
		} else if ($.isEmptyObject(data.focus)) {
			// hopefully only happens during initialization
			return
		} else {
			$('#app_container').html('empty');
		}
		this.update_window_position(display);
	}

	add_info_icon(initializer, updater, parent, update_interval, update_window) {
		initializer(parent);
		let tick = () => {
			updater(parent);
			if (update_window) {
				this.update_window_position();
			}
		}
		tick();
		if (update_interval > 0) {
			setInterval(tick, update_interval);
		}
	}

	initialize_info() {
		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_more';
				let icon = html_templates.icons.more;
				$(parent).append(html_templates.info_icon(id, icon))
				$(`#${id}`).click(() => alert('more!'));
			},
			(parent) => {}, '#info_icon_container', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_mail';
				let icon = html_templates.icons.mail;
				$(parent).append(html_templates.info_icon(id, icon))
				$(`#${id}`).click(() => alert('mail!'));
			},
			(parent) => {}, '#info_icon_container', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_volume';
				let slider_id = 'info_icon_volume_slider';
				let icon = html_templates.icons.volume.level[2];

				$(parent).append(html_templates.info_icon_slider(slider_id));
				$(parent).append(html_templates.info_icon(id, icon));

				// toggle between volume icon and volume slider
				$(`#${slider_id}`).hide();
				$(`#${id}`).click(() => {
					$(`#${id}, #${slider_id}`).toggle();
				});
				// if slider is not hovered switch back to icon
				$(`#${slider_id}`).hover(() => {}, () => {
					$(`#${id}, #${slider_id}`).stop(true, true).delay(1000).toggle(0);
				});
			},
			(parent) => {}, '#info_icon_container', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_wifi';
				let icon = html_templates.icons.network.wifi[3];

				$(parent).append(html_templates.info_icon(id, icon));

				$(`#${id}`).click(() => {
					exec('gnome-terminal -e "systemctl restart network-manager.service"');
				});
			},
			(parent) => {}, '#info_icon_container', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_battery';
				let collection_id = 'info_icon_battery_collection';
				let icon = html_templates.icons.battery.discharging[6];

				$(parent).append(html_templates.info_icon_collection(collection_id, {
					'battery_collection_battery1' : icon,
					'battery_collection_battery2' : icon,
				}));
				$(parent).append(html_templates.info_icon(id, icon));

				// toggle between battery icon and battery collection
				$(`#${collection_id}`).hide();
				$(`#${id}`).click(() => {
					$(`#${id}, #${collection_id}`).toggle();
				});
				// if collection is not hovered switch back to icon
				$(`#${collection_id}`).hover(() => {}, () => {
					$(`#${id}, #${collection_id}`).stop(true, true).delay(1000).toggle(0);
				});
			},
			(parent) => {}, '#info_icon_container', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_power';
				let collection_id = 'info_icon_power_collection';
				let icon = html_templates.icons.power.power;

				let suspend_id = 'power_collection_suspend';
				let restart_id = 'power_collection_restart';
				let shutdown_id = 'power_collection_shutdown';

				$(parent).append(html_templates.info_icon_collection(collection_id, {
					suspend_id : html_templates.icons.power.suspend,
					restart_id : html_templates.icons.power.restart,
					shutdown_id : html_templates.icons.power.shutdown,
				}));
				$(parent).append(html_templates.info_icon(id, icon));

				// toggle between battery icon and battery collection
				$(`#${collection_id}`).hide();
				$(`#${id}`).click(() => {
					$(`#${id}, #${collection_id}`).toggle();
				});
				// if collection is not hovered switch back to icon
				$(`#${collection_id}`).hover(() => {}, () => {
					$(`#${id}, #${collection_id}`).stop(true, true).delay(1000).toggle(0);
				});
			},
			(parent) => {}, '#info_icon_container', -1, false);
	}

	update_info() {
		$('#datetime_container').html(html_templates.date_time());
		this.update_window_position();
	}
}

taskbar = new Taskbar('taskbar');