const $ = require('jquery');
const { exec } = require('child_process');

const base_window = require('./window');
const module_list = {
	'taskbar' : require('./taskbar.js').Taskbar
	//'status' : require('status.js').Status
};

class Bar extends base_window.BaseWindow {
	constructor(parent) {
		super(parent);

		this.modules = {
			bar : null,
			status : null,
			loaded : {}
		};

		this.load_module('taskbar', {core_module : true});
		// this.load_module('status', {status_module : true, core_module : true});
		
		this.set_position(false, false, 100, 0);
	}

	load_module(module, options={}) {
		if (this.modules.loaded[module]) {
			return // already loaded
		} else {
			let status_module = options.status_module || false;
			let core_module = options.core_module || false;

			let module_type = status_module ? 'status' : 'bar';

			if($('#' + module).length == 0) {
				$('#inactive_modules').append(`<div id="${module}" class="${module_type}"></div>`);
			}

			this.modules.loaded[module] = {
				'module_type' : module_type,
				'core_module' : core_module,
				'active' : false,
				'instance' : new module_list[module]('#' + module, this)
			};
		}
		this.activate(module);
	}

	unload_module(module) {
		this.deactivate(module);
		this.modules.loaded[module].instance.unload().then(() => {delete this.modules.loaded[module];});
		$('#' + module).remove();
	}

	activate(module) {
		if (!this.modules.loaded[module]) {
			return
		}

		let module_type = this.modules.loaded[module].module_type;
		let current_module = this.modules[module_type];
		if (current_module) {
			this.deactivate(current_module);
		}

		$('#' + module).detach().appendTo('#core_' + module_type);
		this.modules.loaded[module].active = true;
		this.modules.loaded[module].instance.active = true;
		this.modules.loaded[module].instance.activate();

		this.modules[module_type] = module;
	}

	deactivate(module) {
		if (!this.modules.loaded[module]) {
			return
		}

		let module_type = this.modules.loaded[module].module_type;
		if (this.modules[module_type] != module) {
			return
		}

		$('#' + module).detach().appendTo('#inactive_modules');
		this.modules.loaded[module].active = false;
		this.modules.loaded[module].instance.active = false;
		this.modules.loaded[module].instance.deactivate();

		this.modules[module_type] = null;
	}

	list_modules() {	
		// $('#modules').html();
	}
}

bar = new Bar('#core');