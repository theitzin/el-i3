const fs = require('fs');
let $ = require('jquery');
const { exec } = require('child_process');

const base_window = require('./window')
const wm_interface = require('./wm_interface')
const system_interface = require('./system_interface')
const ht = require('./templates')

class Taskbar extends base_window.BaseWindow {
	constructor(parent) {
		super(parent);
		this.system_interface = new system_interface.SystemInterface();
		this.wm_interface = new wm_interface.i3Interface();
		this.wm_interface.on('update', (data) => this.update_apps(data));
		setInterval(() => this.update_info(), 1000); // call every second
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
					html += ht.taskbar_icon(
						this.get_default_icon_path(), -1, false, 1);	
				} else {
					let focused = win.id == data.focus.window.id;
					html += ht.taskbar_icon (
						this.get_icon_path(win.class.toLowerCase()), win.id, focused, 1);
				}
			}

			$('#app_wrapper').html(html);

			for (let win of workspace.windows) {
				$('#' + win.id).click(e => {
					let id = e.target.id;
				});
				$('#' + win.id).contextmenu(e => {
					this.wm_interface.kill_window(e.target.id);			
				});
			}

			this.wm_interface.move(workspace.num);
		} else if ($.isEmptyObject(data.focus)) {
			// hopefully only happens during initialization
			return
		} else {
			$('#app_wrapper').html('empty');
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

	// toggle between id1 and id2
	// if id2 is not hovered toggle id2 with id3
	bind_elements(id1, id2, id3=null) {
		id3 = id3 ? id3 : id1;

		$('#' + id2).hide();
		$('#' + id1).click(() => {
			$(`#${id1}, #${id2}`).toggle()
				.promise().done(() => this.update_window_position());
		});

		// $('#' + id2).hover(() => {}, () => {
		// 	$(`#${id2}, #${id3}`).stop(true, true).delay(1000).toggle(0)
		// 		.promise().done(() => this.update_window_position());
		// });
	}

	initialize_info() {
		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_more';
				let icon = ht.icons.more;
				$(parent).append(ht.info_icon(id, icon))
				$('#' + id).click(() => alert('more!'));
			},
			(parent) => {}, '#icon_wrapper', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_mail';
				let icon = ht.icons.mail;
				$(parent).append(ht.info_icon(id, icon))
				$('#' + id).click(() => alert('mail!'));
			},
			(parent) => {}, '#icon_wrapper', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_volume';
				let icon = ht.icons.volume.level[2];
				let con_id = 'volume_container';

				$(parent).append(ht.info_icon(id, icon));
				$(parent).append(ht.info_container(con_id));
				$('#' + con_id).append([
					ht.info_slider(con_id + '_slider'),
					ht.info_label(con_id + '_label', ' 50%')
				].join('\n'));
				$('#' + con_id + '_slider > .slider').change(e => {
					$('#' + con_id + '_label').html(e.target.value + '%');
				});

				this.bind_elements(id, con_id);
			},
			(parent) => {}, '#icon_wrapper', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_wifi';
				let icon = ht.icons.network.wifi[3];

				$(parent).append(ht.info_icon(id, icon));

				$('#' + id).click(() => {
					exec('gnome-terminal -e "systemctl restart network-manager.service"');
				});
			},
			(parent) => {}, '#icon_wrapper', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_battery';
				let icon = ht.icons.battery.discharging[6];
				let con_id = 'battery_container';

				$(parent).append(ht.info_icon(id, icon));
				$(parent).append(ht.info_container(con_id));
				$('#' + con_id).append([
					ht.info_icon(con_id + '_battery1', icon),
					ht.info_label(con_id + '_label1', '?%'),
					ht.info_icon(con_id + '_battery2', icon),
					ht.info_label(con_id + '_label2', '?%')
				].join('\n'));

				this.bind_elements(id, con_id);
			},
			(parent) => {}, '#icon_wrapper', -1, false);

		this.add_info_icon(
			(parent) => {
				let id = 'info_icon_power';
				let icon = ht.icons.power.power;
				let con_id = 'power_container';
				let restart_con_id = con_id + '_restart_confirm';
				let shutdown_con_id = con_id + '_shutdown_confirm';

				$(parent).append(ht.info_icon(id, icon));

				$(parent).append(ht.info_container(con_id));
				$('#' + con_id).append([
					ht.info_icon(con_id + '_suspend', ht.icons.power.suspend),
					ht.info_icon(con_id + '_restart', ht.icons.power.restart),
					ht.info_container(restart_con_id),
					ht.info_icon(con_id + '_shutdown', ht.icons.power.shutdown),
					ht.info_container(shutdown_con_id)
				].join('\n'));

				$('#' + restart_con_id).append([
					ht.info_icon(restart_con_id + '_icon', ht.icons.power.restart),
					ht.info_label(restart_con_id + '_label', 'confirm'),
				].join('\n'));

				$('#' + shutdown_con_id).append([
					ht.info_icon(shutdown_con_id + '_icon', ht.icons.power.shutdown),
					ht.info_label(shutdown_con_id + '_label', 'confirm'),
				].join('\n'));

				this.bind_elements(id, con_id);
				this.bind_elements(con_id + '_restart', restart_con_id);
				this.bind_elements(con_id + '_shutdown', shutdown_con_id);
			},
			(parent) => {}, '#icon_wrapper', -1, false);
	}

	update_info() {
		$('#datetime_wrapper').html(ht.date_time());
		this.update_window_position();
	}
}

taskbar = new Taskbar('taskbar');