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
		// ids[0] is default state
		// always return to default state via delayed unhover event
		$(ids.slice(1).join()).hide();

		for (let s of ids.slice(1)) {
			$(s).hover(() => { $([ids[0], s].join()).stop(true, true); }, () => {
				if ($(s).is(':visible')) {
					$([ids[0], s].join()).delay(1000).toggle(0);	
				}
			});
		}
		// transition between other states via click events
		for (let t of transitions) {
			$(t.selector || ids[t.from]).mousedown((e) => { 
				if (e.which == mouse_key) {
					$('.info_icon, .info_container').stop(false, true);
					$([ids[t.from], '.info_container'].join()).hide(0);
					$(ids[t.to]).show(0).promise().done(() => {
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

		this.init_more();
		this.init_mail();
		this.init_volume();
		this.init_wifi();
		this.init_battery();
		this.init_power();
	}

	init_more() {
		let data = {
			id : 'info_icon_more',
			icon : ht.icons.more
		}

		this.add_info_icon(
			(parent) => {
				$(parent).append(ht.info_icon(data.id, data.icon))
				//$('#' + id).click(() => alert('more!'));
			}, '#icon_wrapper', false);
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
					ht.info_slider(data.con_id + '_slider'),
					ht.info_label(data.con_id + '_label', ' 50%')
				].join('\n'));

				$('#' + data.con_id + '_slider > .slider').change(e => {
					set_volume(e.target.value);
					update_state();
				});

				$(parent).append(ht.info_container(data.sink_con_id));
				$('#' + data.sink_con_id).append([
					ht.info_slider(data.sink_con_id + '_slider', 150),
					ht.info_label(data.sink_con_id + '_label', ' 50%')
				].join('\n'));

				$('#' + data.sink_con_id + '_slider > .slider').change(e => {
					set_sink_volume(e.target.value);
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
					ht.info_icon(data.con_id + '_battery1', data.icon),
					ht.info_label(data.con_id + '_label1', '?%'),
					ht.info_icon(data.con_id + '_battery2', data.icon),
					ht.info_label(data.con_id + '_label2', '?%')
				].join('\n'));

				this.bind_elements(['#' + data.id, '#' + data.con_id], [{from : 0, to : 1}]);
			}, '#icon_wrapper', false, 60, (parent) => update_state());
	}

	init_power() {
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
					ht.info_icon(con_id + '_shutdown', ht.icons.power.shutdown)
				].join('\n'));

				$(parent).append(ht.info_container(restart_con_id));
				$('#' + restart_con_id).append([
					ht.info_icon(restart_con_id + '_icon', ht.icons.power.restart),
					ht.info_label(restart_con_id + '_label', 'confirm'),
				].join('\n'));

				$(parent).append(ht.info_container(shutdown_con_id));
				$('#' + shutdown_con_id).append([
					ht.info_icon(shutdown_con_id + '_icon', ht.icons.power.shutdown),
					ht.info_label(shutdown_con_id + '_label', 'confirm'),
				].join('\n'));

				this.bind_elements(['#' + id, '#' + con_id, '#' + restart_con_id, '#' + shutdown_con_id], [
					{from : 0, to : 1},
					{from : 1, to : 2, selector : '#' + con_id + '_restart'},
					{from : 1, to : 3, selector : '#' + con_id + '_shutdown'}
				]);
			}, '#icon_wrapper', false);
	}
}

module.exports = {
	Status : Status
}