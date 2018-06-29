const datetime = require('node-datetime')
// provides HTML templates

function taskbar_icon(icon_path, window_id, focused, number_instances) {
	let wrapper_focused_class = focused ? 'icon_wrapper_focused' : '';
	let icon_focused_class = focused ? 'icon_focused' : '';

    let html = `<div class="icon_wrapper ${wrapper_focused_class}">
    			<img id="${window_id}" class="icon ${icon_focused_class}" src="${icon_path}"/>
    		</div>`;
    return html;
}

function date_time() {
	let dt = datetime.create();
	let date = dt.format('w, f d');
	let time_hm = dt.format('H:M');
	let time_s = dt.format(':S');

	let html = `<div id="datetime_date">${date}</div>
				<div id="datetime_time">
					<div id="datetime_time_hm">${time_hm}</div>
					<div id="datetime_time_s">${time_s}</div>
				</div>`;
	return html;
}

const icons = {
	power : {
		power : 'power-standby',
		suspend :'restore-clock',
		restart : 'restart',
		shutdown : 'power-standby',
	},
	battery : {
		alert : 'battery-alert',
		discharging : ['battery-20', 'battery-30', 'battery-50', 'battery-60', 'battery-80', 'battery-90', 'battery'],
		charging : ['battery-charging-20', 'battery-charging-30', 'battery-charging-50', 'battery-charging-60', 'battery-charging-80', 'battery-charging-90', 'battery-charging-100']
	},
	network : {
		wifi : ['wifi-strength-outline', 'wifi-strength-1', 'wifi-strength-2', 'wifi-strength-3', 'wifi-strength-4'],
		wifi_locked : ['wifi-strength-outline-lock', 'wifi-strength-1-lock', 'wifi-strength-2-lock', 'wifi-strength-3-lock', 'wifi-strength-4-lock'],
		wifi_none : 'wifi-strength-off',
		ethernet : 'ethernet'
	},
	volume : {
		level : ['volume-low', 'volume-medium', 'volume-high'],
		mute : 'volume-off'
	},
	mail : 'email',
	more : 'dots-horizontal'
}

function info_icon(id, icon_name) {
	let html = `<div id="${id}" class="info_icon">
					<i class="mdi mdi-${icon_name}"></i>
				</div>`;
	return html;
}

function info_icon_collection(id, icon_names) {
	let inner_html = [];
	for (let icon_id in icon_names) {
		inner_html.push(`<i id="${icon_id}" class="mdi mdi-${icon_names[icon_id]}"></i>`);
	}

	let html = `<div id="${id}" class="info_icon_collection">
					${inner_html.join('')}
				</div>`;
	return html;
}

function info_icon_slider(id) {
	let html = `<div id="${id}" class="info_icon_collection">
					slider
				</div>`;
	return html;
}

module.exports = {
	icons : icons,
	taskbar_icon : taskbar_icon,
	date_time : date_time,
	info_icon : info_icon,
	info_icon_collection : info_icon_collection,
	info_icon_slider : info_icon_slider
}