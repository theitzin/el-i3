const datetime = require('node-datetime');
// provides HTML templates

function taskbar_container(workspace_num, numbered=false) {
	let number_html = numbered ? '<div class="workspace_wrapper_num"></div>' : '';
    let html = `<div id="workspace${workspace_num}" class="workspace_wrapper">
    				${number_html}
    				<div class="workspace_wrapper_icons"></div>
    			</div>`;
    return html;
}

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
	let date = dt.format('W, f d');
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
	brightness : 'brightness-5',
	calendar : 'calendar',
	filemanager : 'folder',
	mail : 'email',
	more : 'dots-horizontal'
}

function info_base() {
	let html = `<div id="datetime_wrapper"></div>
				<br>
				<div id="icon_wrapper"></div>`;
	return html;
}

function info_icon(id, icon_name) {
	let html = `<div id="${id}" class="info_icon">
					<i class="mdi mdi-${icon_name}"></i>
				</div>`;
	return html;
}

function info_container(id) {
	let html = `<div id="${id}" class="info_container"></div>`;
	return html;	
}

function info_slider(id, max=100) {
	let html = `<div id="${id}" class="info_slider">
  					<input type="range" min="0" max="${max}" step="${max / 100}" class="slider">
				</div>`;
	return html;
}

function info_label(id, text='') {
	let html = `<div id="${id}" class="info_label">${text}</div>`;
	return html;
}

module.exports = {
	icons : icons,
	taskbar_container : taskbar_container,
	taskbar_icon : taskbar_icon,
	date_time : date_time,
	info_base : info_base,
	info_icon : info_icon,
	info_container : info_container,
	info_slider : info_slider,
	info_label : info_label
}