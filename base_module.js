class BaseModule {
	constructor(parent, core) {
		this.parent = parent;
		this.core = core;
		this.active = false; // modules should not manipulate the DOM when false
	}

	activate() {}
	deactivate() {}
	unload() { return new Promise((resolve, reject) => resolve()); } // return Promise
}

module.exports = {
	BaseModule : BaseModule
}
