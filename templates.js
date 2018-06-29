// provides HTML templates

function taskbar_icon (icon_path, window_id, focused, number_instances) {
	wrapper_focused_class = focused ? 'img_wrapper_focused' : '';
	icon_focused_class = focused ? 'icon_focused' : '';

    html = `<div class="img_wrapper ${wrapper_focused_class}">
    			<img id="${window_id}" class="icon ${icon_focused_class}" src="${icon_path}"/>
    		</div>`;
    return html
}

function datetime () {
	date_obj = new Date();
	days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	date = `${days[date_obj.getDay()]}, ${months[date_obj.getMonth()]} ${date_obj.getDate()}`;
	time_hm = `${date_obj.getHours()}:${date_obj.getMinutes()}`;
	time_s = `:${date_obj.getSeconds()}`;

	html = `<div id="datetime">
				<div id="datetime_date">${date}</div>
				<div id="datetime_time">
					<div id="datetime_time_hm">${time_hm}</div>
					<div id="datetime_time_s">${time_s}</div>
				</div>
			</div>`;
}

module.exports = {
    taskbar_icon : taskbar_icon,
    datetime : datetime
}