class SystemInterface {
	constructor() {
		this.cpu_history;
	}

	volume() {}
	brightness() {}
	network_status() {}
	cpu_load() {}
	memory_use() {}
	disk_free() {}
}

module.exports = {
    SystemInterface : SystemInterface
}