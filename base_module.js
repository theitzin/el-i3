class BaseModule {
	constructor(parent) {
		this.parent = parent;
		this.active = false; // modules should not manipulate the DOM when false
	}

	activate() {}
	deactivate() {}
	unload() { return new Promise((resolve, reject) => resolve()); } // return Promise
}

module.exports = {
	BaseModule : BaseModule
}
