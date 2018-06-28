class IconServer {
	constructor(directory_path=null) {
		this.default_icons = directory_path ? true : false;
		this.directory_path = directory_path;

		this.path_index = {};
		// if icon can't be found or generated. return default icon
		this.unavailable = [];
		this.default_path = 'icons/papirus/xfce_unknown.svg';
	}

	get_icon_path(name, id) {
		return new Promise((respond, reject) => {
			if (name in this.path_index) {
				respond(this.path_index[name]);
			} else if (name in this.unavailable) {
				respond(this.default_path);
			} else {
				if (this.default_icons) {					
					try {
						exec('python3 get_icon.py ' + id);
						path = `icons/default/${name}.png`;
				  		fs.accessSync(path, fs.constants.R_OK);
				  		this.path_index[name] = path;				  		
						respond(path);
					} catch (err) {
						console.log(`failed to generate icon for '${name}'`);
						this.unavailable.push(name);
						respond(this.default_path);
					}
				} else {
					name = name.toLowerCase(); // assuming papirus icons
					try {
						path = `icons/${this.directory_path}/${name}.svg`;
				  		fs.accessSync(path, fs.constants.R_OK);
				  		this.path_index[name] = path;				  		
						respond(path);
					} catch (err) {
						console.log(`failed to find icon for ${name} in directory ${this.directory_path}`);
						this.unavailable.push(name);
						respond(this.default_path);
					}
				}
			}
		});
	}
}