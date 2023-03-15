var gameEngine = require('./game-engine.js');
var item = require('./item.js');

var identifierNum = 1;
function enemy(character, x, y, direction) {
	this.character = "robdeprop";
	this.sprite = "walk_right";
	this.standardEnemyHeight = 128;
	this.standardEnemyWidth = 128;
	this.enemyHeight = 128;
	this.enemyWidth = 128;
	this.standardX = -this.enemyWidth;
	this.x = this.standardX;
	this.standardY = gameEngine.gameHeight - 64 - 512 - 512 - 512 - this.enemyHeight;
	this.y = this.standardY;
	this.lastx;
	this.lasty;
	this.standardSpeedX = 15;
	this.angryness = 0;
	this.maxSpeedX = 15;
	this.maxSpeedY = 250;
	this.jumpSpeed = -50;
	this.nextJumpIn = 20;
	this.speedX = this.maxSpeedX;
	this.speedY = 0;
	this.accelerationX = 15;
	this.gravitySpeed = 16;
	this.stunned = 0;
	this.holding = false;
	this.holdingId = 0;
	this.beingheld = false;
	this.beingheldId = 0;
	this.floating = 0;
	this.kicked = 0;
	this.angle = 0;
	this.intrashcan = false;
	this.respawnIn = 0;
	this.trashcanId = 0;
	this.standardDirection = 'right';
	this.direction = this.standardDirection;
	this.onFloor = false;
	this.identifier = "Enemy " + identifierNum;
	this.standardJumpTime = 40;
	identifierNum++;
	
	if (character) {
		this.character = character;
	}
	if(this.character == 'trashbag')
	{
		this.standardSpeedX = 20;
	}
	
	this.maxSpeedX = this.standardSpeedX;
	if (x) {
		this.x = x;
		this.standardX = x;
	}
	if (y) {
		this.y = y;
		this.standardY = y;
	}
	if (direction == 'left' || direction == 'right') {
		if (direction == 'left') {
			this.speedX = -this.maxSpeedX;
		}
		this.direction = direction;
		this.standardDirection = direction;
		this.sprite = 'walk_' + direction;
	}
};

enemy.prototype.setCharacter = function(character) {
	this.character = character;
};

enemy.prototype.getCharacter = function() {
	return this.character;
};

enemy.prototype.getGameObject = function() {
	return {"character": this.getCharacter(), "identifier": this.identifier, "x": this.x, "y": this.y, "height": this.enemyHeight, "sprite": this.sprite, intrashcan: this.intrashcan, angle: this.angle};
};

enemy.prototype.getArrayId = function() {
	for(var i in gameEngine.enemies) {
		if(gameEngine.enemies[i] && gameEngine.enemies[i].identifier == this.identifier) {
			return i;
		}
	}
	return 0;
};

enemy.prototype.update = function() {
	this.lastx = this.x;
	this.lasty = this.y;
	this.x = parseInt(this.x);
	this.speedX = parseInt(this.speedX);
	this.accelerationX = parseInt(this.accelerationX);
	
	if (this.beingheld) {
		return;
	}
	
	if (this.nextJumpIn) {
		this.nextJumpIn--;
	}
	
	if (this.intrashcan) {
		this.angle = this.angle - (this.angle % 90);
		if (!this.respawnIn) {
			this.respawn();
		} else {
			this.respawnIn--;
			return;
		}
	}
	
	if (this.kicked == 0 && !this.stunned && this.character == 'robdeprop') {
		if (this.direction == 'right') {
			this.angle += 20;
		} else {
			this.angle -= 20;
		}
	}
	if (this.kicked == 1) {
		if (this.speedX > 0) {
			this.direction = 'right';
			this.angle -= 30;
		} else {
			this.direction = 'left';
			this.angle += 30;
		}
	}
	if (this.kicked == 2) {
		if (this.direction == 'right') {
			this.angle += 40;
		} else {
			this.angle -= 40;
		}
	}
	
	var floors = gameEngine.level.getFloors();
	var onfloor = false;
	var lastx = this.x;
	var newx = this.x + this.speedX;
	var lasty = this.y;
	var newy = this.y + this.speedY;
	for (var i in floors) {
		if (newx + this.enemyWidth >= floors[i].x && lastx + this.enemyWidth < floors[i].x && newy + this.enemyHeight > floors[i].y && newy < floors[i].y - 64) {
			// Bounce from the left
			this.x = floors[i].x - this.enemyWidth;
			this.speedX = -this.speedX;
		} else if (newx <= floors[i].x + floors[i].width && lastx > floors[i].x + floors[i].width && newy + this.enemyHeight > floors[i].y && newy < floors[i].y - 64) {
			// Bounce from the right
			this.x = floors[i].x + floors[i].width;
			this.speedX = -this.speedX;
		} else if (this.kicked < 2 && floors[i].x < lastx + this.enemyWidth && floors[i].x + floors[i].width > newx && newy + this.enemyHeight >= floors[i].y && lasty + this.enemyHeight <= floors[i].y) {
			// you are standing on a floor
			onfloor = true;
			this.y = floors[i].y - this.enemyHeight;
			this.speedY = 0;
			
			if (this.kicked == 1) {
				// Fall from the screen
				this.kicked = 2;
				this.speedY = -20;
				this.speedX = 0;
			}
		} else if ((floors[i].x < newx + this.enemyWidth && floors[i].x + floors[i].width > newx && newy <= floors[i].y + 64 && lasty > floors[i].y + 64) || (floors[i].x + gameEngine.gameWidth < newx + this.enemyWidth && floors[i].x + gameEngine.gameWidth + floors[i].width > newx && newy <= floors[i].y + 64 && lasty > floors[i].y + 64) || (floors[i].x - gameEngine.gameWidth < newx + this.enemyWidth && floors[i].x - gameEngine.gameWidth + floors[i].width > newx && newy <= floors[i].y + 64 && lasty > floors[i].y + 64)) {
			// you are hitting the floor above you
			gameEngine.level.floors[i].hit(this.x + Math.round(this.enemyWidth / 2));
			this.y = floors[i].y + 64;
			this.speedY = 0;
			this.floating = 6;
		}
	}
	if(this.kicked != 2)
	{
		var trashcans = gameEngine.level.getTrashCans();
		for (var i in trashcans) {
			if (!trashcans[i].available()) {
				if (this.kicked < 2 && trashcans[i].x1() < lastx + this.enemyWidth && trashcans[i].x2() > newx && newy + this.enemyHeight >= trashcans[i].y1() && lasty + this.enemyHeight <= trashcans[i].y1()) {
					// you are standing on the trashcan
					onfloor = true;
					this.y = trashcans[i].y1() - this.enemyHeight;
					this.speedY = 0;
					if (this.kicked == 1) {
						// Fall from the screen
						this.kicked = 2;
						this.speedY = -20;
						this.speedX = 0;
					}
				}
			} else {	
				//console.log('an available trashcan! :o');
				
				//console.log('if('+trashcans[i].x1()+' <'+ lastx + this.enemyWidth+' && '+trashcans[i].x2()+' > '+newx+' && '+newy + this.enemyHeight+' >= '+trashcans[i].y1()+' && '+lasty+' + '+this.enemyHeight+' <= '+trashcans[i].y1()+' && '+this.lives+' > 0)');
				if (trashcans[i].x1(true) < lastx + this.enemyWidth && trashcans[i].x2(true) > newx && newy + this.enemyHeight >= trashcans[i].y1() && lasty + this.enemyHeight <= trashcans[i].y1()) {
					console.log('ENEMY ENTERED');
					// you are entering the trashcan
					trashcans[i].enemyEnters(this.getArrayId());
				}
			}
		}
	}
	this.onFloor = onfloor;
	
	if (this.stunned && onfloor) {
		this.speedX = 0;
		this.sprite = 'stunned';
	} else if (onfloor && this.character != 'trashbag') {
		if (this.direction == 'right') {
			this.sprite = 'walk_right';
			this.speedX = this.maxSpeedX;
		} else if (this.direction == 'left') {
			this.sprite = 'walk_left';
			this.speedX = -this.maxSpeedX;
		}
	} else if (onfloor) {
		this.speedX = 0;
		this.sprite = 'stand_right';
		if(this.direction == 'left')
		{
			this.sprite = 'stand_left';
		}
		if (!this.nextJumpIn) {
			this.speedY = this.jumpSpeed;
			this.nextJumpIn = this.standardJumpTime - Math.round(this.standardJumpTime/4 * this.angryness);
			this.speedX = this.maxSpeedX;
			this.sprite = 'walk_right';
			if(this.direction == 'left')
			{
				this.speedX = -this.speedX;
				this.sprite = 'walk_left';
			}
		}
	}
	this.y += this.speedY;
	if (!onfloor) {
		if (this.floating > 0) {
			this.floating--;
		}
		if (this.floating <= 0 && this.speedY < this.maxSpeedY) {
			this.speedY += this.gravitySpeed;
		}
	}
	if (this.stunned && !this.kicked) {
		this.stunned--;
		if (!this.stunned) {
			if (this.angryness < 3) {
				this.angryness++;
			}
			this.unStun();
		}
	}
	this.x += this.speedX;
	
	if(this.stunned && this.sprite != 'stunned')
	{
		this.sprite = 'stunned';
	}
	
	
	this.screenEndWarp();
};

enemy.prototype.postUpdate = function() {
	if (this.beingheld) {
		if(!gameEngine.players[this.beingheldId] || gameEngine.players[this.beingheldId].holdingType != 'enemy' || gameEngine.players[this.beingheldId].holdingId != this.getArrayId())
		{
			this.beingheld = false;
			this.beinheldId = 0;
			this.stunned = 0;
			return;
		}
		if (gameEngine.players[this.beingheldId].direction == 'right') {
			this.x = gameEngine.players[this.beingheldId].x + gameEngine.players[this.beingheldId].playerWidth - 30;
		} else {
			this.x = gameEngine.players[this.beingheldId].x - this.enemyWidth + 30;
		}
		this.y = gameEngine.players[this.beingheldId].y + Math.round(gameEngine.players[this.beingheldId].playerHeight / 2) - Math.round(this.enemyHeight / 2);
	}
};


enemy.prototype.pause = function()
{
	if(this.sprite == 'walk_right' || this.sprite == 'walk_left')
	{
		this.sprite = 'stand_' + this.direction;
	}
}

enemy.prototype.respawn = function(x,y) {
	// Make a new enemy spawn
	gameEngine.spawnItems.push(gameEngine.level.spawnEnemy(this.character));
	// Remove yourself from the enemies
	gameEngine.enemies[this.getArrayId()] = null;
};


enemy.prototype.stun = function() {
	if(this.kicked) {
		return;
	}
	if(this.stunned) {
		// Un-stun
		this.unStun();
		return;
	}
	this.angle = this.angle - (this.angle % 360);
	gameEngine.playSound('stun');
	
	// this.y += Math.round(this.standardEnemyHeight / 2);
	this.stunned = 180;
	this.sprite = "stunned";
};

enemy.prototype.unStun = function() {
	// un-stun
	this.stunned = 0;
	this.angle = this.angle - (this.angle % 360);
	if (this.direction == "right") {
		this.sprite = "walk_right";
	} else {
		this.sprite = "walk_left";
	}
	this.maxSpeedX = Math.round(this.standardSpeedX * ((this.angryness + 2) / 2));
};

enemy.prototype.interactEnemy = function(playerId,doStun) {
	var enemyId = this.getArrayId();
	var player = gameEngine.players[playerId];
	
	if (player.keys['hold'] && !player.holding && !player.stunned && !player.starred) {
		// Pick the enemy up
		player.holding = true;
		player.holdingId = enemyId;
		player.holdingType = 'enemy';
		player.holdticksLeft = 200;
		this.beingheld = true;
		this.beingheldId = playerId;
		this.speedX = 0;
		this.speedY = 0;
	} else {
		if (this.kicked == 2) {
			// This enemy is in the process of leaving the screen, you cannot kick it
			return;
		}
		// Kick the enemy
		gameEngine.playSound('kick');
		
		if(doStun)
		{
			this.stunned = 180;
		}
		
		if (player.speedX - this.speedX > 0) {
			// Kick to the right
			this.x = player.x + player.playerWidth;
			this.speedX = Math.round(player.maxSpeedX * 1.5) + Math.round(player.speedX / 2);
		} else {
			// Kick to the left
			this.x = player.x - this.enemyWidth;
			this.speedX = -Math.round(player.maxSpeedX * 1.5) + Math.round(player.speedX/2);
		}
		this.speedY = -70;
		this.kicked = 1;
	}
};

enemy.prototype.hitByBowlingball = function(bowlingballId) {

	if(!this.stunned && gameEngine.items[bowlingballId].speedX == 0)
	{
		// Kick the bowlingball
		var extraSpeed = 40;
		if(this.direction == 'left')
		{
			extraSpeed =- extraSpeed;
		}
		gameEngine.items[bowlingballId].speedX = this.speedX + extraSpeed;
		gameEngine.items[bowlingballId].speedY = -40;
		gameEngine.items[bowlingballId].kicked = 1;
	}
	else
	{
		// The bowling ball hits you
		this.kicked = 1;
		this.speedX = Math.round(gameEngine.items[bowlingballId].speedX / 3 * 2);
		this.speedY = -40;
	}
}

enemy.prototype.hitByFloor = function(x, playerId) {
	this.stun();
	this.y = this.y - this.enemyHeight;
	this.speedY = -50;
	var enemyMidX = this.x + Math.round(this.enemyWidth / 2);
	var xDifference = enemyMidX - x;
	this.speedX = Math.round(xDifference / 3);
};

enemy.prototype.produceCoin = function() {
	var coin = new item();
	var speedX = coin.maxSpeedX;
	var spawnPoints = gameEngine.level.spawnPoints;
	var r = Math.floor(Math.random() * spawnPoints.length);
	if (r == spawnPoints.length) {
	    --r; //osl Without this, this runs the risk of causing a crash by selecting a spawnpoint which doesn't exist
	    // e.g.
	    // Math.random() = 0 to 1, 1 for this example
	    // spawnPoints.length = 2 for this example
	    // r = floor(1 * 2)
	    // ∴ r = 2
	    // spawnPoints[2] is null
	}
	var spawnPoint = spawnPoints[r];
	if(spawnPoint.direction == 'left')
	{
		speedX = -coin.maxSpeedX;
	}
	coin.spawnCoin(spawnPoint.x, spawnPoint.y, speedX, 0, 500, true);
	gameEngine.spawnItems.unshift(coin);
};

enemy.prototype.screenEndWarp = function() {
	if (this.y > gameEngine.gameHeight - 512) {
		// Respawn
		if (this.x > gameEngine.gameWidth - 128) {
			// Off the side of the screen
			this.respawn();
		}
		if (this.x < -128) {
			// Off the other side of the screen
			this.respawn();
		}
	}
	if (this.x > gameEngine.gameWidth - 128) {
		// Off the side of the screen
		this.x -= gameEngine.gameWidth;
	}
	if (this.x < - 128) {
		// Off the other side of the screen
		this.x += gameEngine.gameWidth;
	}
	if (this.y > gameEngine.gameHeight) {
		this.produceCoin();
		this.respawn();
	}
};

enemy.prototype.flipDirection = function(newDirection) {
	if(this.kicked)
	{
		return;
	}
	this.speedX = -this.speedX;
	if(newDirection)
	{
		this.direction = newDirection;
		return;
	}
	if(this.direction == 'right') {
		this.direction = 'left';
		return;
	}
	this.direction = 'right';
};

module.exports = enemy;