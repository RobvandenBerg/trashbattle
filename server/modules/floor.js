var gameEngine = require('./game-engine.js');

function floor(x, y, width) {
	this.x = x;
	this.y = y;
	this.width = width;
}

floor.prototype.hit = function(x, playerId) {
	if(x < this.x - 64)
	{
		x += gameEngine.gameWidth;
	}
	else if(x > this.x + this.width + 64)
	{
		x -= gameEngine.gameWidth;
	}
	if (x < this.x - 64 || x > this.x + this.width + 64) {
		// Not on the floor
		return;
	}
	gameEngine.floorHitpoints.push([this.getArrayId(),x - this.x]);
	console.log('Floor hit at point '+x);
	var hitmargin = 70;
	
	// PLAYERS
	for (var i in gameEngine.players) {
		if (gameEngine.players[i] && gameEngine.players[i].y + gameEngine.players[i].playerHeight == this.y && gameEngine.players[i].x - hitmargin <= x && gameEngine.players[i].x + gameEngine.players[i].playerWidth + hitmargin >= x) {
			// Hit the player
			gameEngine.players[i].hitByFloor(x,playerId);
		}
	}
	
	// ENEMIES
	for (var i in gameEngine.enemies) {
		if (gameEngine.enemies[i] && gameEngine.enemies[i].y + gameEngine.enemies[i].enemyHeight == this.y && gameEngine.enemies[i].x - hitmargin <= x && gameEngine.enemies[i].x + gameEngine.enemies[i].enemyWidth + hitmargin >= x) {
			// Hit the enemy
			gameEngine.enemies[i].hitByFloor(x,playerId);
		}
	}
	
	// ITEMS
	for (var i in gameEngine.items) {
		if (gameEngine.items[i] && gameEngine.items[i].y + gameEngine.items[i].itemHeight == this.y && gameEngine.items[i].x - hitmargin <= x && gameEngine.items[i].x + gameEngine.items[i].itemWidth + hitmargin >= x) {
			// Hit the item
			gameEngine.items[i].hitByFloor(x, playerId);
		}
	}
}

floor.prototype.getArrayId = function() {
	for (var i in gameEngine.level.floors) {
		if (gameEngine.level.floors[i] && gameEngine.level.floors[i].x == this.x && gameEngine.level.floors[i].y == this.y) {
			return i;
		}
	}
	return 0;
}

module.exports = floor;