const fs = require('fs');
const $ = require('jquery');
const exec = require('node-exec-promise').exec;

const base_module = require('./base_module');
const sc = require('system-control')();
// const si = require('systeminformation');
const ht = require('./templates');

class Status extends base_module.BaseModule {
	constructor(parent, core) {
		super(parent, core);

		this.init();
	}

	add_info_icon(initializer, parent, update_window, update_interval=0, updater=null) {
		initializer(parent);
		if (!updater) {
			return
		}
		let tick = () => {
			updater(parent);
			if (update_window) {
				this.core.update_window();
			}
		}
		tick();
		if (update_interval > 0) {
			setInterval(tick, update_interval * 1000);
		}
	}

	bind_elements(ids, transitions, mouse_key=1) {
		if (ids.length < 2) {
			return
		}
		let elements = [];
		for (let id of ids) {
			if ($(id).hasClass('info_container')) {
				elements.push({
					id : id,
					vs : id // visibility selector
				});
			} else {
				elements.push({
					id : id,
					vs : '#icon_wrapper > .info_icon'
				});
			}
		}

		// ids[0] is default state
		// always return to default state via delayed unhover event
		for (let e of elements.slice(1)) {
			$(e.vs).addClass('info_hidden');
			$(e.vs).hover(() => { $([elements[0].vs, e.vs].join()).stop(true, true); }, () => {
				if (!$(e.vs).hasClass('info_hidden')) {
					$([elements[0].vs, e.vs].join()).delay(1000).queue(() => {
						$(elements[0].vs).removeClass('info_hidden');
						$(e.vs).addClass('info_hidden');
					});
				}
			});
		}
		// transition between other states via click events
		for (let t of transitions) {
			$(t.click || elements[t.from].id).mousedown((e) => { 
				if (e.which == mouse_key) {
					$('.info_icon, .info_container').stop(false, true);
					$([elements[t.from].vs, '.info_container'].join()).addClass('info_hidden');
					$(elements[t.to].vs).removeClass('info_hidden').queue(() => {
						this.core.update_window();
					});
				}
			});
		}
	}

	replace_icon(id, icon) {
		$(`#${id} > i`).attr('class', 'mdi mdi-' + icon);
	}

	init() {
		setInterval(() => {
			$('#datetime_wrapper').html(ht.date_time());
			this.core.update_window();
		}, 1000); // call every second

		$(this.parent).html(ht.info_base());

		this.init_power();
		this.init_battery();
		this.init_wifi();
		this.init_volume();
		this.init_mail();
		this.init_brightness();
		this.init_calendar();
		this.init_filemanager();
		this.init_display();
		this.init_more();
	}

	init_power() {
		let data = {
			id : 'info_icon_power',
			icon : ht.icons.power.power,
			con_id : 'power_container',
			rcon_id : 'power_container_restart_confirm',
			scon_id : 'power_container_shutdown_confirm'
		}

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon));

				$(parent).append(ht.info_container(data.con_id));
				$('#' + data.con_id).append([
					ht.info_icon(data.con_id + '_shutdown', ht.icons.power.shutdown),
					ht.info_icon(data.con_id + '_restart', ht.icons.power.restart),
					ht.info_icon(data.con_id + '_suspend', ht.icons.power.suspend)
				].join('\n'));

				$(parent).append(ht.info_container(data.rcon_id));
				$('#' + data.rcon_id).append([
					ht.info_label(data.rcon_id + '_label', 'confirm restart'),
					ht.info_icon(data.rcon_id + '_icon', ht.icons.power.restart)
				].join('\n'));

				$(parent).append(ht.info_container(data.scon_id));
				$('#' + data.scon_id).append([
					ht.info_label(data.scon_id + '_label', 'confirm shutdown'),
					ht.info_icon(data.scon_id + '_icon', ht.icons.power.shutdown)
				].join('\n'));

				this.bind_elements(['#' + data.id, '#' + data.con_id, '#' + data.rcon_id, '#' + data.scon_id], [
					{from : 0, to : 1},
					{from : 1, to : 2, click : '#' + data.con_id + '_restart'},
					{from : 1, to : 3, click : '#' + data.con_id + '_shutdown'}
				]);
			}, '#icon_wrapper', false);
	}

	init_battery() {
		let data = {
			id : 'info_icon_battery',
			icon : ht.icons.battery.discharging[6],
			con_id : 'battery_container'
		}

		let battery_icon = (p, s) => {
			let icons = s == 'discharging' ? ht.icons.battery.discharging : ht.icons.battery.charging;
			if (s == 'discharging' && p <= 20) return ht.icons.battery.alert;
			else if (p <= 25) return icons[0];
			else if (p <= 40) return icons[1];
			else if (p <= 55) return icons[2];
			else if (p <= 70) return icons[3];
			else if (p <= 85) return icons[4];
			else if (p <= 95) return icons[5];
			else return icons[6];
		}

		let update_state = () => Promise.all([
			exec('scripts/battery_percent 0'),
			exec('scripts/battery_percent 1'),
			exec('scripts/battery_state 0'),
			exec('scripts/battery_state 1')
		]).then(values => {
			let state = {
				percent0 : parseInt(values[0].stdout.trim()),
				percent1 : parseInt(values[1].stdout.trim()),
				state0 : values[2].stdout.trim(),
				state1 : values[3].stdout.trim()
			}
			// combined data
			state.percent = (state.percent0 + 0.2 * state.percent1) / 1.2;
			if (state.state0 == 'fully-charged' && state.state1 == 'fully-charged') {
				state.state = 'fully-charged';
			} else if (state.state0 == 'discharging' && state.state1 == 'discharging') {
				state.state = 'discharging';
			} else {
				state.state = 'charging';
			}

			$('#' + data.con_id + '_label1').html(state.percent0 + '%');
			$('#' + data.con_id + '_label2').html(state.percent1 + '%');
			this.replace_icon(data.id, battery_icon(state.percent, state.state));
			this.replace_icon(data.con_id + '_battery1', battery_icon(state.percent0, state.state0));
			this.replace_icon(data.con_id + '_battery2', battery_icon(state.percent1, state.state1));
		});

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon));
				$(parent).append(ht.info_container(data.con_id));
				$('#' + data.con_id).append([
					ht.info_label(data.con_id + '_label1', '?'),
					ht.info_icon(data.con_id + '_battery1', data.icon),
					ht.info_label(data.con_id + '_label2', '?'),
					ht.info_icon(data.con_id + '_battery2', data.icon)
				].join('\n'));

				this.bind_elements(['#' + data.id, '#' + data.con_id], [{from : 0, to : 1}]);
			}, '#icon_wrapper', false, 60, (parent) => update_state());
	}

	init_wifi() {
		let data = {
			id : 'info_icon_wifi',
			icon : ht.icons.network.wifi[4]
		}

		let volume_icon = (state) => {
			if (!state.wifi_up && !state.ethernet_up) return ht.icons.network.wifi_none;
			else if (!state.wifi_up && state.ethernet_up) return ht.icons.network.ethernet;
			else if (state.wifi_quality <= 20) return ht.icons.network.wifi[0];
			else if (state.wifi_quality <= 40) return ht.icons.network.wifi[1];
			else if (state.wifi_quality <= 60) return ht.icons.network.wifi[2];
			else if (state.wifi_quality <= 80) return ht.icons.network.wifi[3];
			else return ht.icons.network.wifi[4];
		}

		let update_state = () => Promise.all([
			exec('scripts/network_state wlp4s0'),
			exec('scripts/network_state enp0s31f6'),
			exec('scripts/network_quality wlp4s0')
		]).then(values => {
			let state = {
				wifi_up : values[0].stdout.trim() == 'up',
				ethernet_up : values[1].stdout.trim() == 'up',
				wifi_quality : parseInt(values[2].stdout.trim())
			}

			this.replace_icon(data.id, volume_icon(state));
		});

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon));

				$('#' + data.id).click(() => {
					exec('scripts/reset_wifi');
				});
			}, '#icon_wrapper', false, 60, (parent) => update_state());
	}

		init_volume() {
		let data = {
			id : 'info_icon_volume',
			icon : ht.icons.volume.level[2],
			con_id : 'volume_container',
			sink_con_id : 'sink_volume_container'
		}

		let set_volume = (v) => sc.audio.setSystemVolume(v);
		let set_sink_volume = (v) => exec(`scripts/set_sink_volume ${Math.min(150, Math.max(0, v))}`);
		let toggle_mute = () => sc.audio.isMuted().then((muted) => sc.audio.mute(!muted));

		let volume_icon = (v, muted) => {
			if (muted) return ht.icons.volume.mute;
			else if (v <= 25) return ht.icons.volume.level[0];
			else if (v <= 75) return ht.icons.volume.level[1];
			else return ht.icons.volume.level[2];
		}

		let update_state = () => Promise.all([
			sc.audio.getSystemVolume(),
			exec('scripts/get_sink_volume'),
			sc.audio.isMuted()
		]).then(values => {
			let state = {
				volume : values[0],
				sink_volume : parseInt(values[1].stdout.trim()),
				muted : values[2],
				icon : volume_icon(values[0], values[2])
			}
			
			$('#' + data.con_id + '_slider > .slider')[0].value = state.volume;
			$('#' + data.con_id + '_label').html(state.volume + '%');

			$('#' + data.sink_con_id + '_slider > .slider')[0].value = state.sink_volume;
			$('#' + data.sink_con_id + '_label').html(state.sink_volume + '%');

			this.replace_icon(data.id, state.icon);
		});

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon));

				$(parent).append(ht.info_container(data.con_id));
				$('#' + data.con_id).append([
					ht.info_label(data.con_id + '_label', '?', 30),
					ht.info_slider(data.con_id + '_slider')
				].join('\n'));

				$('#' + data.con_id + '_slider > .slider').change(e => {
					set_volume(parseInt(e.target.value));
					update_state();
				});

				$(parent).append(ht.info_container(data.sink_con_id));
				$('#' + data.sink_con_id).append([
					ht.info_label(data.sink_con_id + '_label', '?', 30),
					ht.info_slider(data.sink_con_id + '_slider', 150)
				].join('\n'));

				$('#' + data.sink_con_id + '_slider > .slider').change(e => {
					set_sink_volume(parseInt(e.target.value));
					update_state();
				});

				this.bind_elements(['#' + data.id, '#' + data.con_id], [{from : 0, to : 1}]);
				this.bind_elements(['#' + data.id, '#' + data.sink_con_id], [{from : 0, to : 1}], 2);

				$('#' + data.id).mousedown(e => {
					// other click events handeled by bind_elements
					if (e.which == 3) {
						toggle_mute().then(() => update_state());
					}
				});
			}, '#icon_wrapper', false, 60, (parent) => update_state());
	}

	init_mail() {
		let data = {
			id : 'info_icon_mail',
			icon : ht.icons.mail
		}

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon));
				$('#' + data.id).hide();
				$('#' + data.id).click(() => {
					exec('scripts/gmail_open');
				});
			}, '#icon_wrapper', false, 60, 
			(parent) => {
				exec('scripts/gmail').then(out  => {
					if (out.stdout.trim() == '0') {
						$('#' + data.id).hide();
					} else {
						$('#' + data.id).show();
					}
				});
			});
	}

	init_more() {
		let data = {
			id : 'info_icon_more',
			icon : ht.icons.more,
			optional_ids : [
				'#info_icon_brightness',
				'#info_icon_calendar',
				'#info_icon_filemanager'
			].join()
		}
		let timer = null;

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon))
				$(data.optional_ids).addClass('info_optional');
				$('#' + data.id).click(() => {
					$(`#${data.id}, ${data.optional_ids}`).toggleClass('info_optional');
				});
				$(data.optional_ids).hover(() => { 
					clearTimeout(timer);
					$(data.optional_ids).stop(true, true); 
				}, () => {
					$(data.optional_ids).queue(() => timer = setTimeout(() => {
						$(`#${data.id}, ${data.optional_ids}`).toggleClass('info_optional');
					}, 1000));
				});
			}, '#icon_wrapper', false);
	}

	init_brightness() {
		let data = {
			id : 'info_icon_brightness',
			icon : ht.icons.brightness,
			con_id : 'brightness_container'
		}

		let set_brightness = (b) => sc.display.setBrightness(Math.max(0.01, b)); // avoid black screen

		let update_state = () => sc.display.getBrightness().then(b => {
			$('#' + data.con_id + '_slider > .slider')[0].value = b;
			$('#' + data.con_id + '_label').html(Math.ceil(100 * b) + '%');
		});

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon));

				$(parent).append(ht.info_container(data.con_id));
				$('#' + data.con_id).append([
					ht.info_label(data.con_id + '_label', '?', 30),
					ht.info_slider(data.con_id + '_slider', 1)
				].join('\n'));

				$('#' + data.con_id + '_slider > .slider').change(e => {
					set_brightness(parseFloat(e.target.value)).catch(e => console.log(e));
					update_state();
				});

				this.bind_elements(['#' + data.id, '#' + data.con_id], [{from : 0, to : 1}]);
			}, '#icon_wrapper', false, 60, (parent) => update_state());
	}

	init_calendar() {
		let data = {
			id : 'info_icon_calendar',
			icon : ht.icons.calendar
		}

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon));
				$('#' + data.id).click(() => {
					exec('scripts/calendar_open');
				});
			}, '#icon_wrapper', false);
	}

	init_filemanager() {
		let data = {
			id : 'info_icon_filemanager',
			icon : ht.icons.filemanager
		}

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon));
				$('#' + data.id).click(() => {
					exec('scripts/nautilus_open');
				});
			}, '#icon_wrapper', false);
	}

	init_display() {

	}
}

module.exports = {
	Status : Status
}