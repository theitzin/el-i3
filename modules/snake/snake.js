const $ = require('jquery');

const base_module = require('../../base_module');

class Snake extends base_module.BaseModule {
	constructor(parent, core) {
		super(parent, core);

		this.config = {
			interval : 100,
			initial_length : 6,
			initial_x : 10,
			initial_y : 5,
			initial_dir : [1, 0],
			grid_size_x : 30,
			grid_size_y : 15,
			tile_size : 10,
			snake_color : '#3d3937',
			food_color : 'red'
		}

		this.initialize()
		this.timer = setInterval(() => this.tick(), this.config.interval);
	}

	activate() {
		if (!this.timer) {
			this.timer = setInterval(() => this.tick(), this.config.interval);
		}
	}

	deactivate() {
		clearInterval(this.timer);
		this.timer = null;
	}

	initialize() {
		this.canvas_id = 'snake_canvas';
		$(this.parent).html(`<canvas id="${this.canvas_id}"></canvas>`);

		this.canvas = document.getElementById(this.canvas_id);
		this.ctx = this.canvas.getContext('2d');
		this.ctx.canvas.width  = this.config.tile_size * this.config.grid_size_x;
  		this.ctx.canvas.height = this.config.tile_size * this.config.grid_size_y;

		$('body').keydown((event) => {
			switch(event.which) {
				case 37:
					if (this.direction[0] != 1)
						this.direction = [-1, 0];
					break;
				case 38:
					if (this.direction[1] != 1)
						this.direction = [0, -1];
					break;
				case 39:
					if (this.direction[0] != -1)
						this.direction = [1, 0];
					break;
				case 40:
					if (this.direction[1] != -1)
						this.direction = [0, 1];
					break;
			}
		});

		this.reset();
	}

	reset() {
		this.snake = [];
		let x = this.config.initial_x;
		let y = this.config.initial_y;
		for (let i = 0; i < this.config.initial_length; i++) {
			this.snake.push(this.create_tile(x, y));
			x += this.config.initial_dir[0];
			y += this.config.initial_dir[1];
		}
		this.direction = this.config.initial_dir;
		this.spawn_food();
	}

	tick() {
		let old_head = this.snake[this.snake.length - 1];
		let new_head = this.create_tile(old_head.x + this.direction[0], old_head.y + this.direction[1]);

		if (this.includes_tile(this.snake, new_head)
			|| 	new_head.x < 0
			|| 	new_head.x >= this.config.grid_size_x
			|| 	new_head.y < 0
			|| 	new_head.y >= this.config.grid_size_y) {
			this.game_over();
			return;
		}
		this.snake.push(new_head);

		if (new_head.x == this.food.x && new_head.y == this.food.y) {
			// points etc
			this.spawn_food();
		} else {
			this.snake.shift();
		}

		this.draw();
	}

	game_over() {
		this.reset();
	}

	draw() {
		this.ctx.clearRect(0, 0, this.config.tile_size * this.config.grid_size_x, this.config.tile_size * this.config.grid_size_y);
		for (let tile of this.snake) {
			this.draw_tile(tile, this.config.snake_color);
		}
		this.draw_tile(this.food, this.config.food_color);
	}

	spawn_food() {
		while (true) {
			let x = Math.floor(Math.random() * this.config.grid_size_x);
			let y = Math.floor(Math.random() * this.config.grid_size_y);
			let food = this.create_tile(x, y);

			if (!this.includes_tile(this.snake, food)) {
				this.food = food;
				return
			}
		}
	}

	create_tile(x, y) {
		return {
			x : x,
			y : y
		}
	}

	draw_tile(tile, color) {
		this.ctx.fillStyle = color;
		this.ctx.fillRect(
			tile.x * this.config.tile_size, 
			tile.y * this.config.tile_size, 
			this.config.tile_size, 
			this.config.tile_size);
	}

	includes_tile(tiles, t) {
		for (let tile of tiles) {
			if (tile.x == t.x && tile.y == t.y) {
				return true;
			}
		}
		return false;
	}
}

module.exports = {
	Snake : Snake
}