// provides HTML templates

function get_icon_html (icon_path, window_id, focused, number_instances) {
	wrapper_focused_class = focused ? 'img_wrapper_focused' : '';
	icon_focused_class = focused ? 'icon_focused' : '';

    html = `<div class="img_wrapper ${wrapper_focused_class}">
    			<img id="icon_${win.id}" class="icon ${icon_focused_class}" src="${icon_path}"/>
    		</div>`;
    return html
}