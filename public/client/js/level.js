var level = 
(function () {
		var levels = [];
		
		var levelObject = {
			version: 1.0,
			author: "Rob van den Berg, Mitchell Olsthoorn",
			updated: "",
			getLevel: function (i) {
				if (levels[i]) {
					return levels[i];
				}
			}
		};
		
		function floor(x, y, width) {
			this.x = x;
			this.y = y;
			this.width = width;
		}
		
		function basicLevel() {
			this.floors = [];
			this.levelWidth = 2730;
			this.levelHeight = 2048;
			this.viewWidth = this.levelWidth;
			this.viewHeight = this.levelHeight;
			this.loop = false;
			
			// FLOORS
			
			// Ground
			var f = new floor(-128, this.levelHeight - 64, this.levelWidth + 128);
			this.floors.push(f);
			
			// First floor left
			f = new floor(-128, Math.round(this.levelHeight / 4 * 3) - 64, 950 + 128);
			this.floors.push(f);
			
			// First floor right
			f = new floor(this.levelWidth - 950, Math.round(this.levelHeight / 4 * 3) - 64, 950);
			this.floors.push(f);
			
			// Second floor
			f = new floor(Math.round(this.levelWidth / 4), Math.round(this.levelHeight / 2) - 64, Math.round(this.levelWidth / 2));
			this.floors.push(f);
			
			// Third floor left
			f = new floor(-128, Math.round(this.levelHeight / 4) - 64, 1150 + 128);
			this.floors.push(f);
			
			// Third floor right
			f = new floor(this.levelWidth - 1150, Math.round(this.levelHeight / 4) - 64, 1150);
			this.floors.push(f);
		};
		
		function hardLevel() {
			this.floors = [];
			this.levelWidth = 2730 * 2;
			this.levelHeight = 2048 * 2;
			this.viewWidth = this.levelWidth / 1.5;
			this.viewHeight = this.viewWidth * this.levelHeight / this.levelWidth;
			this.loop = true;
			
			// FLOORS
			
			// Ground
			var f = new floor(-128, this.levelHeight - 64, (this.levelWidth + 128)/ 2 - 200);
			this.floors.push(f);

			var f = new floor((this.levelWidth + 128)/2 + 200, this.levelHeight - 64, (this.levelWidth + 128)/ 2 - 200);
			this.floors.push(f);
			
			// First floor left
			f = new floor(-128, this.levelHeight - 512 - 64, 1550 + 128);
			this.floors.push(f);
			
			// First floor right
			f = new floor(this.levelWidth - 1550, this.levelHeight - 512 - 64, 1550);
			this.floors.push(f);
			
			// Second floor
			f = new floor(Math.round(this.levelWidth / 4), this.levelHeight - 512 - 512 - 64, Math.round(this.levelWidth / 2));
			this.floors.push(f);
			
			// Third floor left
			f = new floor(-128, this.levelHeight - 512 - 512 - 512 - 64, 1450 + 128);
			this.floors.push(f);
			
			// Third floor right
			f = new floor(this.levelWidth - 1450, this.levelHeight - 512 - 512 - 512 - 64, 1450);
			this.floors.push(f);
		};
		
		levels[0] = new basicLevel();
		levels[1] = new hardLevel();
		     
		return levelObject;
}());