class SystemInterface {
	constructor() {
		this.cpu_history;
	}

	volume() {}
	brightness() {}
	network_status() {}
	cpu_load() {}
	memory_use() {}
	disk_space() {}
	display_layout() {}
	power_action() {}
	launch_filemanager() {}
	mail() {}
	calendar() {}
}

module.exports = {
    SystemInterface : SystemInterface
}