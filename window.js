const electron = require('electron');
const $ = require('jquery')
;
class BaseWindow {
    constructor(parent) {
        this.window_instance = require('electron').remote.getCurrentWindow();

        this.parent = parent;
        this.content = '';

        this.width = 500;
        this.height = 200;
        this.left_align = false; // false means right align
        this.top_align = false; // false means bottom align
        this.horizontal_margin = 100;
        this.vertical_margin = 0;

        this.monitor = 'eDP1';
        this.screen_width;
        this.screen_height;
        this.set_monitor(this.monitor);
    }

    set_position(left_align, top_align, horizontal_margin, vertical_margin) {
        this.left_align = left_align;
        this.top_align = top_align;
        this.horizontal_margin = horizontal_margin;
        this.vertical_margin = vertical_margin;
        this.update_window_position()
    }

    set_monitor(monitor) {
        // select correct monitor
        let screen = electron.screen.getPrimaryDisplay();
        this.screen_width = screen.size.width;
        this.screen_height = screen.size.height;
        this.monitor = monitor;
        this.update_window_position();
    }

    set_size(width, height) {
        this.width = width;
        this.height = height;
        this.update_window_position();
    }

    set_content(selector, content, noupdate=false) {
        this.content = content;
        $(selector).html(this.content);
        if (!noupdate) {
            this.set_size($(`#${this.parent}`).width(), $(`#${this.parent}`).height());
        }
    }

    update_window_position() {
        let position_x;
        let position_y;
        if (this.left_align)
            position_x = this.horizontal_margin;
        else
            position_x = this.screen_width - this.width - this.horizontal_margin;

        if (this.top_align)
            position_y = this.vertical_margin;
        else
            position_y = this.screen_height - this.height - this.vertical_margin;

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
