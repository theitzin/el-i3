const electron = require('electron');
const exec = require('node-exec-promise').exec;
const $ = require('jquery');
;
class BaseWindow {
	constructor(parent) {
		this.window_instance = electron.remote.getCurrentWindow();
		this.window_instance.setMovable(false); // not implemented on linux
		this.window_instance.setResizable(false);

		this.parent = parent;
		this.content = '';

		this.width = 200;
		this.height = 50;
		this.left_align = true; // false means right align
		this.top_align = true; // false means bottom align
		this.horizontal_margin = 0;
		this.vertical_margin = 0;
		this.zoom_factor = 1;

		// some initialization because screen_map update is async
		this.screen_map = {
			'eDP1' : {
				width: 1920,
				height: 1080,
				x_offset: 0,
				y_offset: 0
			}
		};
		this.display = 'eDP1';
		this.set_screen_map();        
	}

	set_position(left_align, top_align, horizontal_margin, vertical_margin) {
		this.left_align = left_align;
		this.top_align = top_align;
		this.horizontal_margin = horizontal_margin;
		this.vertical_margin = vertical_margin;
		this.update_window()
	}

	set_screen_map() {
		exec('xrandr | grep " connected "').then((out) => {
			if (out.error) {
				console.log('error generating screen offset map');
				return
			}
			this.screen_map = {};
			for (let line of out.stdout.split('\n')) {
				if (line.length == 0)
					continue;
				let parts = line.split(' ');
				let info = (parts[2] == 'primary') ? parts[3] : parts[2];
				info = info.split(/[x\+]/);

				this.screen_map[parts[0]] = {
					width: parseInt(info[0]),
					height: parseInt(info[1]),
					x_offset: parseInt(info[2]),
					y_offset: parseInt(info[3])
				}
			}
		});
	}

	update_window(display=null, force_update=false) {
		let width = Math.round($(this.parent).width());
		let height = Math.round($(this.parent).height());

		if (!force_update 
			&& this.width == width 
			&&	this.height == height 
			&& (!display || display == this.display)) {
			return;
		}

		this.zoom_factor = electron.webFrame.getZoomFactor();
		this.width = Math.floor(width * this.zoom_factor);
		this.height = Math.floor(height * this.zoom_factor);

		if (display) {
			if (!(display in this.screen_map)) {
				this.set_screen_map();
			}
			if (!(display in this.screen_map)) {
				// still not element => ignore
				return;
			}
			this.display = display;
		}

		let position_x;
		let position_y;

		if (this.left_align)
			position_x = this.horizontal_margin;
		else
			position_x = this.screen_map[this.display].width - this.width - this.horizontal_margin;

		if (this.top_align)
			position_y = this.vertical_margin;
		else
			position_y = this.screen_map[this.display].height - this.height - this.vertical_margin;

		position_x += this.screen_map[this.display].x_offset;
		position_y += this.screen_map[this.display].y_offset;

		this.window_instance.setBounds({
			x: position_x,
			y: position_y,
			width: this.width, 
			height: this.height
		});
	}
}

module.exports = {
	BaseWindow : BaseWindow
}
