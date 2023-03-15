var gameEngine = require('./game-engine.js');

function player(username, userid, coins, ranking, socketid, userObject) {
	this.guest = false;
	this.userid = userid;
	if(userid == 0) {
		this.guest = true;
	}
	this.username = username;
	this.socketid = socketid;
	this.character = null;
	this.sprite = "stand_right";
	this.x = 0;
	this.y = 0;
	this.lastx;
	this.lasty;
	this.speedX = 0;
	this.speedY = 0;
	this.playerNumber = 0;
	this.maxSpeedX = 40;
	this.maxSpeedY = 100;
	this.standardPlayerHeight = 256;
	this.standardPlayerWidth = 128;
	this.playerHeight = 256;
	this.playerWidth = 128;
	this.accelerationX = 15;
	this.gravitySpeed = 16;
	this.extendJumpSpeed = 5;
	this.jumpSpeed = 115;
	this.stunned = 0;
	this.totalScore = 0;
	this.direction = "right";
	this.newRightPress = false;
	this.newLeftPress = false;
	this.newJumpPress = false;
	this.holding = false;
	this.holdingId = 0;
	this.beingheld = false;
	this.holdingType = '';
	this.beingheldId = 0;
	this.holdticksLeft = 0;
	this.enteringTrashcan = false;
	this.intrashcan = false;
	this.kicked = 0;
	this.trashcanId = 0;
	this.keys = [];
	this.lives = 3;
	this.starred = 0;
	this.dead = false;
	this.invincibility = 0;
	this.setOutOfTrashcan = false;
	this.coins = 0;
	this.coinsUser = coins;
	this.ranking = ranking;
	this.onFloor = false;
	this.place = 0;
	this.present = true;
	this.userObject = userObject;
	this.prizeCoins = 0;
	this.leftTrashCan = false;
}

player.prototype.inputDown = function(keyFunction) {
	if (this.keys[keyFunction]) {
		// This key is already pressed
		return;
	}
	if (keyFunction == 'right') {
		this.newRightPress = true;
	}
	if (keyFunction == 'left') {
		this.newLeftPress = true;
	}
	if (keyFunction == 'jump') {
		this.newJumpPress = true;
	}
	this.keys[keyFunction] = true;
}

player.prototype.inputUp = function(keyFunction) {
	this.keys[keyFunction] = false;
}

player.prototype.setPlayerNumber = function(num) {
	this.playerNumber = num;
}

player.prototype.prepareForGame = function(x,y,direction,lives) {
	this.x = x;
	this.y = y;
	this.lastx = this.x;
	this.lasty = this.y;
	this.direction = direction;
	this.speedX = 0;
	this.speedY = 0;
	this.floating = 0;
	this.stunned = 0;
	this.playerHeight = this.standardPlayerHeight;
	this.holdticksLeft = 0;
	this.holding = false;
	this.holdingId = 0;
	this.holdingType = '';
	this.beingheld = false;
	this.beingheldId = 0;
	this.kicked = 0;
	this.enteringTrashcan = false;
	this.intrashcan = false;
	this.trashcanId = 0;
	this.setOutOfTrashcan = false;
	this.newRightPress = false;
	this.newLeftPress = false;
	this.newJumpPress = false;
	this.keys = [];
	this.lives = lives;
	this.coins = 0;
	this.starred = 0;
	this.dead = false;
	this.invincibility = 0;
	this.onFloor = false;
	this.leftTrashCan = false;
	this.sprite = "stand_" + this.direction;
	console.log('Prepared ' +this.username + ' with player number ' +this.playerNumber + ' on x location ' +this.x);
}

player.prototype.isGuest = function() {
	return this.guest;
}

player.prototype.getUsername = function() {
  return this.username;
};

player.prototype.getUserId = function() {
	return this.userid;
}

player.prototype.setCharacter = function(character) {
	this.character = character;
}

player.prototype.getCharacter = function() {
	return this.character;
}

player.prototype.getLobbyObject = function() {
	return {username: this.getUsername(), userid: this.getUserId(), coins: this.coinsUser, ranking: this.ranking};
}

player.prototype.getScoreObject = function() {
	return {username: this.getUsername(), character: this.character, totalScore: this.totalScore, coinsTotal: this.coinsUser, coinsGained: this.coins, ranking: this.ranking, rankingGained: 0, place: this.place};
}

player.prototype.getGameObject = function() {
	var close = false;
	if(this.coins == gameEngine.maxCoins - 1 && this.lives > 0)
	{
		close = true;
	}
	return {username: this.getUsername(), userid: this.getUserId(), character: this.getCharacter(), x: this.x, y: this.y, height: this.playerHeight, sprite: this.sprite, lives: this.lives, dead: this.dead, invincibility: this.invincibility, starred: this.starred, intrashcan: this.intrashcan, coins: this.coins, close: close};
}

player.prototype.getArrayId = function() {
	for (var i in gameEngine.players) {
		if (gameEngine.players[i] && gameEngine.players[i].username == this.username) {
			return parseInt(i);
		}
	}
	return 0;
}

player.prototype.gainCoin = function() {
	this.coins += 1;
}

player.prototype.loseCoin = function() {
	this.coins -= 1;
}

player.prototype.setStarred = function(amountOfTicks) {
	this.starred = amountOfTicks;
}

player.prototype.update = function() {
	this.lastx = this.x;
	this.lasty = this.y;
	this.x = parseInt(this.x);
	this.speedX = parseInt(this.speedX);
	this.accelerationX = parseInt(this.accelerationX);
	var attemptHop = false;
	
	if (this.dead) {
		// Dead players can't update
		return;
	}
	
	if (this.invincibility > 0) {
		this.invincibility--;
	}
	
	if (this.starred > 0) {
		this.starred--;
	}
	
	if (this.intrashcan) {
		// If you are in the trashcan, don't update either
		if (this.setOutOfTrashcan) {
			this.setOutOfTrashcan = false;
			this.intrashcan = false;
			this.trashcanId = 0;
		} else {
			if (this.newJumpPress) {
				this.newJumpPress = false;
				gameEngine.level.trashcans[this.trashcanId].struggle('jump');
			}
			if (this.newLeftPress) {
				this.newLeftPress = false;
				gameEngine.level.trashcans[this.trashcanId].struggle('left');
			}
			if (this.newRightPress) {
				this.newRightPress = false;
				gameEngine.level.trashcans[this.trashcanId].struggle('right');
			}
			return;
		}
	}
	
	if (this.beingheld) {
		var struggle = false;
		if (this.newRightPress) {
			this.newRightPress = false;
			struggle = true;
		}
		if (this.newLeftPress) {
			this.newLeftPress = false;
			struggle = true;
		}
		if (struggle) {
			gameEngine.players[this.beingheldId].holdticksLeft = Math.max(gameEngine.players[this.beingheldId].holdticksLeft - 10,0);
		}
		return;
	}
	
	if (this.holding) {
		if(this.holdticksLeft)
		{
			this.holdticksLeft--;
		}
		if (this.holdticksLeft <= 0 && this.holdingType != 'item') {
			this.dropEntity();
		} else if (!this.keys['hold']) {
			gameEngine.playSound('throw');
			// PLAYER
			if (this.holdingType == 'player' && gameEngine.players[this.holdingId]) {
				gameEngine.players[this.holdingId].beingheld = false;
				gameEngine.players[this.holdingId].beingheldId = false;
				// Throw the player
				if (this.direction == 'right') {
					// Throw to the right
					gameEngine.players[this.holdingId].x = this.x + this.playerWidth;
					gameEngine.players[this.holdingId].speedX = Math.round(this.maxSpeedX * 1.5) + Math.round(this.speedX/2);
				} else {
					// Throw to the left
					gameEngine.players[this.holdingId].x = this.x - gameEngine.players[this.holdingId].playerWidth;
					gameEngine.players[this.holdingId].speedX = -Math.round(this.maxSpeedX * 1.5) + Math.round(this.speedX/2);
				}
				gameEngine.players[this.holdingId].kicked = 1;
				gameEngine.players[this.holdingId].speedY = Math.max(Math.round(this.speedY/2),0) - 20;
			}
			// ENEMY
			if (this.holdingType == 'enemy' && gameEngine.enemies[this.holdingId]) {
				gameEngine.enemies[this.holdingId].beingheld = false;
				gameEngine.enemies[this.holdingId].beingheldId = false;
				// Throw the enemy
				if (this.direction == 'right') {
					// Throw to the right
					gameEngine.enemies[this.holdingId].x = this.x + this.playerWidth;
					gameEngine.enemies[this.holdingId].speedX = Math.round(this.maxSpeedX * 1.5) + Math.round(this.speedX/2);
				} else {
					// Throw to the left
					gameEngine.enemies[this.holdingId].x = this.x - gameEngine.enemies[this.holdingId].enemyWidth;
					gameEngine.enemies[this.holdingId].speedX = -Math.round(this.maxSpeedX * 1.5) + Math.round(this.speedX/2);
				}
				gameEngine.enemies[this.holdingId].speedY = Math.max(Math.round(this.speedY/2),0) -20;
				gameEngine.enemies[this.holdingId].kicked = 1;
			}
			// ITEM
			if (this.holdingType == 'item' && gameEngine.items[this.holdingId]) {
				gameEngine.items[this.holdingId].beingheld = false;
				gameEngine.items[this.holdingId].beingheldId = false;
				// Throw the items
				if (this.direction == 'right') {
					// Throw to the right
					gameEngine.items[this.holdingId].x = this.x + this.playerWidth;
					gameEngine.items[this.holdingId].speedX = Math.round(this.maxSpeedX * 1.5) + Math.round(this.speedX/2);
				} else {
					// Throw to the left
					gameEngine.items[this.holdingId].x = this.x - gameEngine.items[this.holdingId].itemWidth;
					gameEngine.items[this.holdingId].speedX = -Math.round(this.maxSpeedX * 1.5) + Math.round(this.speedX/2);
				}
				gameEngine.items[this.holdingId].speedY = -20;
				gameEngine.items[this.holdingId].kicked = 1;
			}
			this.holdingId = 0;
			this.holding = false;
			this.holdingType = '';
		}
	}
	
	if (this.keys['right'] && !this.keys['left'] && this.speedX < this.maxSpeedX && this.lives > 0) {
		if (!this.stunned) {
			if (this.speedX > 0) {
				this.speedX = Math.min(this.speedX + this.accelerationX, this.maxSpeedX);
				this.sprite = "walk_right";
			} else {
				this.speedX += this.accelerationX;
			}
		} else {
			if (this.newRightPress) {
				this.newRightPress = false;
				attemptHop = 'right';
			}
		}
	} else if (this.keys['left'] && !this.keys['right'] && this.speedX > -this.maxSpeedX && this.lives > 0) {
		if (!this.stunned) {
			if (this.speedX < 0) {
				this.speedX = Math.max(this.speedX - this.accelerationX, -this.maxSpeedX);
				this.sprite = "walk_left";
			} else {
				this.speedX -= this.accelerationX;
			}
		} else {
			if (this.newLeftPress) {
				this.newLeftPress = false;
				attemptHop = 'left';
			}
		}
	}
	var floors = gameEngine.level.getFloors();
	var onfloor = false;
	
	var lastx = this.x;
	var newx = this.x + this.speedX;
	var lasty = this.y;
	var newy = this.y + this.speedY;
	for (var i in floors) {
		if (newx + this.playerWidth >= floors[i].x && lastx + this.playerWidth < floors[i].x && newy + this.playerHeight > floors[i].y && newy < floors[i].y - 64 && this.lives > 0) {
			// Bounce from the left
			this.x = floors[i].x - this.playerWidth;
			this.speedX = -this.speedX;
		} else if (newx <= floors[i].x + floors[i].width && lastx > floors[i].x + floors[i].width && newy + this.playerHeight > floors[i].y && newy < floors[i].y - 64 && this.lives > 0) {
			// Bounce from the right
			this.x = floors[i].x + floors[i].width;
			this.speedX = -this.speedX;
		} else if (floors[i].x < lastx + this.playerWidth && floors[i].x + floors[i].width > newx && newy + this.playerHeight >= floors[i].y && lasty + this.playerHeight <= floors[i].y && this.lives > 0) {
			// you are standing on a floor
			onfloor = true;
			this.y = floors[i].y - this.playerHeight;
			this.speedY = 0;
			if ((this.newJumpPress || this.keys['jump']) && !this.stunned && lasty + this.playerHeight >= floors[i].y) {
				gameEngine.playSound('jump');
				this.speedY = -this.jumpSpeed;
			}
		} else if ((floors[i].x < newx + this.playerWidth && floors[i].x + floors[i].width > newx && newy <= floors[i].y + 64 && lasty > floors[i].y + 64 && this.lives > 0) || (floors[i].x + gameEngine.gameWidth < newx + this.playerWidth && floors[i].x + gameEngine.gameWidth + floors[i].width > newx && newy <= floors[i].y + 64 && lasty > floors[i].y + 64 && this.lives > 0) || (floors[i].x - gameEngine.gameWidth < newx + this.playerWidth && floors[i].x - gameEngine.gameWidth + floors[i].width > newx && newy <= floors[i].y + 64 && lasty > floors[i].y + 64 && this.lives > 0)) {
			// you are hitting the floor above you
			gameEngine.level.floors[i].hit(this.x + Math.round(this.playerWidth / 2), this.getArrayId());
			this.y = floors[i].y + 64;
			this.speedY = 0;
			this.floating = 6;
		}
	}
	var trashcans = gameEngine.level.getTrashCans();
	for (var i in trashcans) {
		if (!trashcans[i].available()) {
			if (trashcans[i].x1() < lastx + this.playerWidth && trashcans[i].x2() > newx && newy + this.playerHeight >= trashcans[i].y1() && lasty + this.playerHeight <= trashcans[i].y1() && this.lives > 0) {
				// you are standing on the trashcan
				onfloor = true;
				this.y = trashcans[i].y1() - this.playerHeight;
				this.speedY = 0;
				if (this.keys['jump'] && !this.stunned) {
					gameEngine.playSound('jump');
					this.speedY = -this.jumpSpeed;
				}
			}
		} else {
			var extraMargin = false;
			if(this.kicked)
			{
				extraMargin = true;
			}
			if (trashcans[i].x1(extraMargin) < lastx + this.playerWidth && trashcans[i].x2(extraMargin) > newx && newy + this.playerHeight >= trashcans[i].y1() && lasty + this.playerHeight <= trashcans[i].y1() && this.lives > 0 && (!this.leftTrashCan || this.kicked)) {
				console.log('I ENTERED');
				// you are entering the trashcan
				trashcans[i].playerEnters(this.getArrayId(),i);
			}
		}
	}
	this.onFloor = onfloor;
	if(this.onFloor)
	{
		this.leftTrashCan = false;
	}
	this.y += this.speedY;
	
	if(this.kicked && this.onFloor && !this.stunned)
	{
		this.kicked = 0;
	}
	
	
	if ((onfloor || (!onfloor && !this.stunned)) && ((!this.stunned && ((this.keys['left'] && this.keys['right']) || (!this.keys['left'] && !this.keys['right']))) || this.stunned)) {
		// If you are on the floor, or not on the floor but not stunned, slowly lose speed
		if (this.speedX > 0) {
			this.speedX = Math.max(this.speedX - Math.round(this.accelerationX / 3 * 2), 0);
			this.sprite = "stand_right";
		} else if (this.speedX < 0) {
			this.speedX = Math.min(this.speedX + Math.round(this.accelerationX / 3 * 2), 0);
			this.sprite = "stand_left";
		}
	}
	if(onfloor && (this.speedX > this.maxSpeedX || this.speedX < -this.maxSpeedX))
	{
		if (this.speedX > 0) {
			this.speedX -= Math.round(this.accelerationX / 3 * 2);
		} else if (this.speedX < 0) {
			this.speedX += Math.round(this.accelerationX / 3 * 2);
		}
	}
	if (!onfloor) {
		if (!this.floating && !this.stunned && this.speedY < 0) {
			if (this.keys['jump']) {
				// Extend your jump
				this.speedY -= this.extendJumpSpeed;
			}
		}
		if (this.floating > 0) {
			this.floating--;
		}
		if (this.floating <= 0 && this.speedY < this.maxSpeedY) {
			this.speedY += this.gravitySpeed;
		}
	}
	if (this.stunned && this.lives > 0) {
		this.stunned--;
		if (!this.stunned) {
			// Un-stun
			this.playerHeight = this.standardPlayerHeight;
			this.y -= Math.round(this.standardPlayerHeight / 2);
		}
		if (attemptHop == 'right' && onfloor) {
			this.sprite = 'stand_right';
			if (this.speedX < this.maxSpeedX) {
				this.speedX += this.accelerationX;
			}
			this.speedY = - 30;
		}
		if (attemptHop == 'left' && onfloor) {
			this.sprite = 'stand_left';
			if (this.speedX > -this.maxSpeedX) {
				this.speedX -= this.accelerationX;
			}
			this.speedY = - 30;
		}
	}
	this.x += this.speedX;
	
	if (this.speedX > 0) {
		this.direction = "right";
	}
	if (this.speedX < 0) {
		this.direction = "left";
	}
	
	if(this.stunned && this.lives > 0)
	{
		this.sprite = 'stunned';
	}
	if(this.sprite == 'stunned' && !this.stunned)
	{
		this.sprite = 'stand_' + this.direction;
	}
	
	if(!this.intrashcan)
	{
		this.newJumpPress = false;
	}
	
	this.screenEndWarp();
}

player.prototype.postUpdate = function() {
	if (this.beingheld && !this.dead) {
		if(!gameEngine.players[this.beingheldId] || gameEngine.players[this.beingheldId].holdingType != 'player' || gameEngine.players[this.beingheldId].holdingId != this.getArrayId())
		{
			this.playerHeight = this.standardPlayerHeight;
			this.stunned = 0;
			this.beingheld = false;
			this.beinheldId = 0;
			return;
		}
		if (gameEngine.players[this.beingheldId].direction == 'right') {
			this.x = gameEngine.players[this.beingheldId].x + gameEngine.players[this.beingheldId].playerWidth - 30;
		} else {
			this.x = gameEngine.players[this.beingheldId].x - this.playerWidth + 30;
		}
		this.y = gameEngine.players[this.beingheldId].y + Math.round(gameEngine.players[this.beingheldId].playerHeight / 2) - Math.round(this.playerHeight / 2);
	}
}

player.prototype.dropEntity = function() {
	if (!this.holding) {
		return;
	}
	// PLAYER
	if (this.holdingType == 'player' && gameEngine.players[this.holdingId]) {
		gameEngine.players[this.holdingId].beingheld = false;
		gameEngine.players[this.holdingId].beingheldId = 0;
		gameEngine.players[this.holdingId].playerHeight = gameEngine.players[this.holdingId].standardPlayerHeight;
		gameEngine.players[this.holdingId].y = this.y;
		gameEngine.players[this.holdingId].stunned = 0;
		if(this.direction == 'right') {
			gameEngine.players[this.holdingId].x = this.x + this.playerWidth;
		} else {
			gameEngine.players[this.holdingId].x = this.x - gameEngine.players[this.holdingId].playerWidth;
		}
	}
	// ENEMY
	if (this.holdingType == 'enemy' && gameEngine.enemies[this.holdingId]) {
		gameEngine.enemies[this.holdingId].beingheld = false;
		gameEngine.enemies[this.holdingId].beingheldId = 0;
		gameEngine.enemies[this.holdingId].y = this.y;
		gameEngine.enemies[this.holdingId].unStun();
		if(this.direction == 'right') {
			gameEngine.enemies[this.holdingId].x = this.x + this.playerWidth;
		} else {
			gameEngine.enemies[this.holdingId].x = this.x - gameEngine.enemies[this.holdingId].enemyWidth;
		}
	}
	// ITEM
	if (this.holdingType == 'item' && gameEngine.items[this.holdingId]) {
		gameEngine.items[this.holdingId].beingheld = false;
		gameEngine.items[this.holdingId].beingheldId = 0;
		gameEngine.items[this.holdingId].y = this.y;
		gameEngine.items[this.holdingId].kicked = 0;
		if (this.direction == 'right')
		{
			gameEngine.items[this.holdingId].x = this.x + this.playerWidth;
		} else {
			gameEngine.items[this.holdingId].x = this.x - gameEngine.items[this.holdingId].itemWidth;
		}
	}
	this.holdingId = 0;
	this.holding = false;
	this.holdingType = '';
}

player.prototype.win = function() {
	this.totalScore++;
	this.sprite = "win";
	this.invincibility = 0;
	this.starred = 0;
	// Add to the prize money fault for this player
	this.prizeCoins += (gameEngine.amountOfPlayers() - 1);
}

player.prototype.lose = function() {
	this.invincitility = 0;
	this.starred = 0;
	if(this.sprite == 'walk_right')
	{
		this.sprite = 'stand_right';
	}
	if(this.sprite == 'walk_left')
	{
		this.sprite = 'stand_left';
	}
}

player.prototype.canWin = function() {
	if(this.coins >= gameEngine.maxCoins)
	{
		return true;
	}
	if (this.intrashcan || this.lives == 0) {
		// You can't win while you're in the trashcan or while you're dead
		return false;
	}
	return this.onFloor;
}

player.prototype.prepareForQuit = function(thisPlayerIndex) {
	if (this.intrashcan) {
		gameEngine.level.trashcans[this.trashcanId].holderQuits();
	}
	for (var i in gameEngine.players) {
		if (gameEngine.players[i] && gameEngine.players[i].holding && gameEngine.players[i].holdingType == 'player' && gameEngine.players[i].holdingId == thisPlayerIndex) {
			gameEngine.players[i].dropEntity();
		}
	}
}

player.prototype.stun = function() {
	if (this.stunned || this.invincibility || this.starred) {
		// You can't stun a stunned or invincible player
		return;
	}
	
	gameEngine.playSound('stun');
	
	this.playerHeight = Math.round(this.standardPlayerHeight / 2);
	this.stunned = 70;
	this.newRightPress = false;
	this.newLeftPress = false;
	this.newJumpPress = false;
	
	if (this.holding) {
		// Release the player you're holding
		this.dropEntity();
	}
}

player.prototype.unStun = function() {
	if (!this.stunned) {
		return;
	}
	this.stunned = 0;
	this.playerHeight = this.standardPlayerHeight;
	this.y -= Math.round(this.standardPlayerHeight / 2);
	
}

player.prototype.interactPlayer = function(otherPlayerId) {
	var playerId = this.getArrayId();
	var otherPlayer = gameEngine.players[otherPlayerId];
	
	if (this.keys['hold'] && !this.holding) {
		// Pick the other player up
		this.holding = true;
		this.holdingId = otherPlayerId;
		this.holdingType = 'player';
		this.holdticksLeft = 200;
		otherPlayer.beingheld = true;
		otherPlayer.beingheldId = playerId;
		otherPlayer.speedX = 0;
		otherPlayer.speedY = 0;
		otherPlayer.newRightPress = false;
		otherPlayer.newLeftPress = false;
		otherPlayer.newJumpPress = false;
	} else {
		// Kick the other player
		gameEngine.playSound('kick');
		if (this.speedX - otherPlayer.speedX > 0) {
			// Kick to the right
			otherPlayer.x = this.x + this.playerWidth;
			otherPlayer.speedX = Math.round(this.maxSpeedX * 1.5) + Math.round(this.speedX/2);
		} else {
			// Kick to the left
			otherPlayer.x = this.x - otherPlayer.playerWidth;
			otherPlayer.speedX = -Math.round(this.maxSpeedX * 1.5) + Math.round(this.speedX/2);
		}
		otherPlayer.kicked = 1;
		otherPlayer.speedY = -70;
	}
}

player.prototype.hitByBowlingball = function(bowlingballId) {
	if(this.starred || gameEngine.items[bowlingballId].speedX == 0)
	{
		// Kick the bowlingball
		var extraSpeed = 40;
		if(this.starred)
		{
			extraSpeed = 50;
		}
		if(this.speedX < gameEngine.items[bowlingballId].speedX)
		{
			// Kick to the left
			extraSpeed =- extraSpeed;
			gameEngine.items[bowlingballId].x = this.x - gameEngine.items[bowlingballId].itemWidth;
		}
		else
		{
			// Kick to the right
			gameEngine.items[bowlingballId].x = this.x + this.playerWidth;
		}
		gameEngine.items[bowlingballId].speedX = this.speedX + extraSpeed;
		gameEngine.items[bowlingballId].speedY = -40;
		gameEngine.items[bowlingballId].kicked = 1;
	}
	else if(!this.invincibility)
	{
		// The bowling ball hits you
		this.speedX = gameEngine.items[bowlingballId].speedX;
		this.speedY = -40;
		this.hitByEnemy();
	}
}

player.prototype.hitByBasketball = function(basketballId) {
	var originalSpeedX = gameEngine.items[basketballId].speedX;
	var originalBallDirection = gameEngine.items[basketballId].direction;
	
		// Kick the bowlingball
		var extraSpeed = 10;
		if(this.starred)
		{
			extraSpeed = 50;
		}
		if(this.speedX < gameEngine.items[basketballId].speedX)
		{
			// Kick to the left
			extraSpeed =- extraSpeed;
			gameEngine.items[basketballId].x = this.x - gameEngine.items[basketballId].itemWidth;
		}
		else
		{
			// Kick to the right
			gameEngine.items[basketballId].x = this.x + this.playerWidth;
		}
		gameEngine.items[basketballId].speedX = gameEngine.items[basketballId].speedX * -1 + this.speedX + extraSpeed;
		gameEngine.items[basketballId].speedY = -40;
		gameEngine.items[basketballId].kicked = 1;

	if(!this.starred && !this.invincibility && this.direction != originalBallDirection)
	{
		// The basket ball STUNS you, but still bounces
		this.speedX = gameEngine.items[basketballId].speedX;
		this.speedY = -40 * originalSpeedX/20;
		this.stun();
	}
}

player.prototype.hitByEnemy = function() {
	if (!this.invincibility && !this.starred) {
		if (this.beingheld) {
			// If you are being held by somebody, make that somebody drop you
			if (gameEngine.players[this.beingheldId]) {
				gameEngine.players[this.beingheldId].dropEntity();
			}
		}
		gameEngine.playSound('playerhit');
		this.lives--;
		this.invincibility = 75;
		console.log('Player ' + this.username + ' got hit. ' + this.lives + ' lives remaining');
	}
	console.log('Invincibility ' + this.username + ': ' + this.invincibility + ' remaining');
	if (this.lives <= 0) {
		// Die
		this.dropEntity();
		this.speedY = -80;
		this.playerHeight = this.standardPlayerHeight;
		this.speedX = 0;
		this.sprite = "stand_down";
		this.invincibility = 0;
		this.coins = 0;
	}
}

player.prototype.hitByFloor = function(x, playerId) {
	this.stun();
	this.speedY = -50;
	var playerMidX = this.x + Math.round(this.playerWidth / 2);
	var xDifference = playerMidX - x;
	this.speedX = Math.round(xDifference / 3);
}

player.prototype.screenEndWarp = function() {
	if (this.x > gameEngine.gameWidth - 128) {
		// Off the side of the screen
		this.x -= gameEngine.gameWidth;
	}
	if (this.x < -128) {
		// Off the other side of the screen
		this.x += gameEngine.gameWidth;
	}
	if (this.y > gameEngine.gameHeight) {
		this.lives--;
		if(this.lives < 1)
		{
			// Die
			this.lives = 0;
			this.coins = 0;
			this.dead = true;
			gameEngine.lastDeath = new Date().getTime();
		}
		else
		{
			// Respawn
			this.invincibility = 75;
			this.unStun();
			this.starred = 0;
			this.beingheld = 0;
			this.dropEntity();
			var spawnPoint = gameEngine.level.getPlayerStartPoint(this.getArrayId() + 1);
			this.x = spawnPoint.x;
			this.y = spawnPoint.y;
			this.speedX = 0;
			this.speedY = 0;
			this.direction = spawnPoint.direction;
		}
	}
}

player.prototype.getUserObject = function() {
	return this.userObject;
}

module.exports = player;