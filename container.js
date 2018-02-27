const i3 = require('i3').createClient();

class Container {
	constructor () {
		this.dom_element = 0;
	}

	set_position() {
		mainWindow.setPosition(200, 300);
	}
}