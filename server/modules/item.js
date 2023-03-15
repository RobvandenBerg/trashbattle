var gameEngine = require('./game-engine.js');

var identifierNum = 1;
function item() {
	this.character = "egg";
	this.sprite = "normal";
	this.x = Math.round(Math.random() * 500);
	this.y = gameEngine.gameHeight - 64 - 128;
	this.lastx;
	this.lasty;
	this.standardSpeedX = 0;
	this.speedX = 0;
	this.speedY = 0;
	this.maxSpeedX = 15;
	this.bowlingBallSpeedX = 50;
	this.maxSpeedY = 250;
	this.standardItemHeight = 128;
	this.standardItemWidth = 128;
	this.itemHeight = 128;
	this.itemWidth = 128;
	this.accelerationX = 0;
	this.gravitySpeed = 16;
	this.beingheld = false;
	this.beingheldId = 0;
	this.kicked = 0;
	this.angle = 0;
	this.disappearsIn = 0;
	this.disappearing = false;
	this.intrashcan = false;
	this.direction = 'right';
	this.moving = false;
	this.onfloor = false;
	this.itemInside = 'coin';
	this.identifier = "Item " + identifierNum;
	identifierNum++;
};

item.prototype.setCharacter = function(character) {
	this.character = character;
};

item.prototype.getCharacter = function() {
	return this.character;
};

item.prototype.getArrayId = function() {
	for (var i in gameEngine.items) {
		if(gameEngine.items[i] && gameEngine.items[i].identifier == this.identifier) {
			return i;
		}
	}
	return 0;
};

item.prototype.getGameObject = function() {
	var disappearing = null;
	if (this.disappearing) {
		disappearing = this.disappearsIn;
	}
	return {character: this.getCharacter(), identifier: this.identifier, x: this.x, y: this.y, height: this.itemHeight, width: this.itemWidth, sprite: this.sprite, angle: this.angle, disappearing: disappearing, intrashcan: this.intrashcan};
};

item.prototype.update = function() {
	this.x = parseInt(this.x);
	this.y = parseInt(this.y);
	this.lastx = this.x;
	this.lasty = this.y;
	this.speedX = parseInt(this.speedX);
	this.speedY = parseInt(this.speedY);
	this.accelerationX = parseInt(this.accelerationX);
	
	if(this.character == 'bowlingball' && this.maxSpeedX != this.bowlingBallSpeedX)
	{
		this.maxSpeedX = this.bowlingBallSpeedX;
	}
	
	if (this.beingheld) {
		return;
	}
	
	if (this.disappearsIn > 0) {
		this.disappearsIn--;
		if (!this.disappearsIn) {
			// Remove this item
			var itemId = this.getArrayId();
			gameEngine.items[itemId] = null;
		}
	}
	
	if(this.sprite == 'gain')
	{
		return;
	}
	
	if (this.intrashcan) {
		this.angle = this.angle - (this.angle % 90);
		return;
	}
	
	if (this.kicked == 1 && this.character != 'tnt' && this.character != 'bowlingball') {
		if(this.speedX > 0) {
			this.direction = 'right';
			this.angle -= 30;
		} else {
			this.direction = 'left';
			this.angle += 30;
		}
	}
	
	if (this.kicked == 2 && this.character != 'egg' && this.character != 'tnt') {
		if(this.direction == 'right') {
			this.angle += 40;
		} else {
			this.angle -= 40;
		}
	}
	else if(this.kicked == 2 && this.character == 'egg')
	{
		this.angle = this.angle - (this.angle % 360);
	}
	
	if(this.speedX > 0)
	{
		this.direction = 'right';
	}
	else if(this.speedX < 0)
	{
		this.direction = 'left';
	}
	
	if(this.character == 'bowlingball' && !this.beingheld && this.speedX != 0)
	{
		if(this.direction == 'right') {
			this.angle += 40;
		} else {
			this.angle -= 40;
		}
	}
	
	if(this.character == 'basketball' && !this.beingheld && this.speedX != 0)
	{
		//if(this.direction == 'right') {
			this.angle += this.speedX * 2;
		//} else {
		//	this.angle -= this.speedX * 2;
		//}
	}
	
	var floors = gameEngine.level.getFloors();
	var onfloor = false;
	for(var i in floors) {
		var lastx = this.x;
		var newx = this.x + this.speedX;
		var lasty = this.y;
		var newy = this.y + this.speedY;
		
		if (newx + this.itemWidth >= floors[i].x && lastx + this.itemWidth < floors[i].x && newy + this.itemHeight > floors[i].y && newy < floors[i].y - 64) {
			// Bounce from the left
			this.x = floors[i].x - this.itemWidth;
			this.speedX = -this.speedX;
		} else if (newx <= floors[i].x + floors[i].width && lastx > floors[i].x + floors[i].width && newy + this.itemHeight > floors[i].y && newy < floors[i].y - 64) {
			// Bounce from the right
			this.x = floors[i].x + floors[i].width;
			this.speedX = -this.speedX;
		} else if (this.kicked < 2 && floors[i].x < lastx + this.itemWidth && floors[i].x + floors[i].width > newx && newy + this.itemHeight >= floors[i].y && lasty + this.itemHeight <= floors[i].y) {
			// you are standing on a floor
			onfloor = true;
			this.y = floors[i].y - this.itemHeight;
			if(this.character != 'basketball' || this.speedY < 2)
			{
				this.speedY = 0;
			}
			
			if (this.kicked == 1) {
				// Fall from the screen
				if(this.character != 'bowlingball' && this.character != 'basketball')
				{
					this.kicked = 2;
				}
				if(this.character != 'egg' && this.character != 'bowlingball' && this.character != 'basketball')
				{
					this.speedY = -20;
					this.speedX = 0;
				}
			}
			
		} else if (floors[i].x < newx + this.itemWidth && floors[i].x + floors[i].width > newx && newy <= floors[i].y + 64 && lasty > floors[i].y + 64) {
			// you are hitting the floor above you
			gameEngine.level.floors[i].hit(this.x + Math.round(this.itemWidth / 2));
			this.y = floors[i].y + 64;
			this.speedY = 0;
		}
	}
	if(this.kicked != 2)
	{
		var trashcans = gameEngine.level.getTrashCans();
		for (var i in trashcans) {
			if (!trashcans[i].available()) {
				if (this.kicked < 2 && trashcans[i].x1() < lastx + this.itemWidth && trashcans[i].x2() > newx && newy + this.itemHeight >= trashcans[i].y1() && lasty + this.itemHeight <= trashcans[i].y1()) {
					// you are standing on the trashcan
					onfloor = true;
					this.y = trashcans[i].y1() - this.itemHeight;
					this.speedY = 0;
					if (this.kicked == 1) {
						// Fall from the screen
						if(this.character != 'bowlingball' && this.character != 'basketball')
						{
							this.kicked = 2;
						}
						if(this.character != 'egg' && this.character != 'bowlingball' && this.character != 'basketball')
						{
							this.speedY = -20;
							this.speedX = 0;
						}
					}
				}
			} else {	
				//console.log('an available trashcan! :o');
				
				//console.log('if('+trashcans[i].x1()+' <'+ lastx + this.itemWidth+' && '+trashcans[i].x2()+' > '+newx+' && '+newy + this.itemHeight+' >= '+trashcans[i].y1()+' && '+lasty+' + '+this.itemHeight+' <= '+trashcans[i].y1()+' && '+this.lives+' > 0)');
				if (trashcans[i].x1() < lastx + this.itemWidth && trashcans[i].x2() > newx && newy + this.itemHeight >= trashcans[i].y1() && lasty + this.itemHeight <= trashcans[i].y1()) {
					console.log('item ENTERED');
					// you are entering the trashcan
					trashcans[i].itemEnters(this.getArrayId());
				}
			}
		}
	}
	this.onfloor = onfloor;
	
	if(this.onfloor)
	{
		if (this.character == 'egg' && this.sprite == 'normal') {
			this.eggBreak();
		}
			
		if (this.character == 'tnt' && this.sprite == 'normal') {
			this.tntDrop(this.kicker);
		}
	}
	
	if (onfloor && this.moving && (this.character != 'bowlingball' || (this.character == 'bowlingball' && this.kicked)) && this.character != 'basketball') {
		if (this.direction == 'right' && this.speedX != this.maxSpeedX) {
			this.speedX = this.maxSpeedX;
		} else if (this.direction == 'left' && this.speedX != -this.maxSpeedX) {
			this.speedX = -this.maxSpeedX;
		} 
	} else if (onfloor && this.character != 'basketball') {
		this.speedX = 0;
	}
	
	if(this.character == 'basketball' && this.onfloor && this.speedY > 2)
	{
		// bounce
		this.speedY -= this.speedY;
	}
	else
	{
		this.y += this.speedY;
	}
	
	if (!onfloor && (this.character != 'egg' || (this.character == 'egg' && this.sprite != 'broken'))) {
		if(this.speedY < this.maxSpeedY) {
			this.speedY += this.gravitySpeed;
		}
	}
	this.x += this.speedX;
	
	switch (this.character) {
		case "coin":
			this.updateCoin();
			break;
		case "egg":
			this.updateEgg();
			break;
		case "star":
			this.updateStar();
			break;
		case "tnt":
			this.updateTnt();
			break;
		case "fish":
			this.updateFish();
			break;
		case "bowlingball":
			this.updateBowlingball();
			break;
		case "basketball":
			this.updateBasketball();
			break;
		case "heart":
			this.updateHeart();
			break;
	}
	
	this.screenEndWarp();
};

item.prototype.updateCoin = function() {	
	if (this.disappearsIn == 50) {
		this.disappearing = true;
	}
};

item.prototype.updateEgg = function() {
};

item.prototype.updateStar = function() {
};

item.prototype.updateTnt = function() {
};

item.prototype.updateFish = function() {
};

item.prototype.updateBowlingball = function() {
};

item.prototype.updateBasketball = function() {
	
};

item.prototype.updateHeart = function() {
};

item.prototype.postUpdate = function() {
	var player = gameEngine.players[this.beingheldId];
	if (this.beingheld) {
		if(!gameEngine.players[this.beingheldId] || gameEngine.players[this.beingheldId].holdingType != 'item' || gameEngine.players[this.beingheldId].holdingId != this.getArrayId())
		{
			this.beingheld = false;
			this.beinheldId = 0;
			return;
		}
		if (player.direction == 'right') {
			this.x = player.x + player.playerWidth - 30;
		} else {
			this.x = player.x - this.itemWidth + 30;
		}
		this.y = player.y + Math.round(player.playerHeight / 2) - Math.round(this.itemHeight / 2);
	}
};

item.prototype.interactItem = function(playerId) {
	var itemId = this.getArrayId();
	var player = gameEngine.players[playerId];
	
	if(!player)
	{
		return;
	}
	
	if (player.keys['hold'] && !player.holding && !player.stunned && !player.beingheld && this.character != 'star' && this.character != 'coin' && this.character != 'heart' && (this.character != 'bowlingball' || (this.character == 'bowlingball' && this.speedX == 0)) && (this.character != 'egg' || (this.character == 'egg' && this.sprite != 'broken'))) {
		// Pick the item up
		player.holding = true;
		player.holdingId = itemId;
		player.holdingType = 'item';
		player.holdticksLeft = 200;
		this.beingheld = true;
		this.beingheldId = playerId;
		this.angle = this.angle - (this.angle % 360);
		this.speedX = 0;
		this.speedY = 0;
	} else {
		switch (this.character) {
			case "coin":
				this.interactItemCoin(playerId);
				break;
			case "egg":
				this.interactItemEgg(playerId);
				break;
			case "star":
				this.interactItemStar(playerId);
				break;
			case "tnt":
				this.interactItemTnt(playerId);
				break;
			case "fish":
				this.interactItemFish(playerId);
				break;
			case "bowlingball":
				this.interactItemBowlingball(playerId);
				break;
			case "basketball":
				this.interactItemBasketball(playerId);
				break;
			case "heart":
				this.interactItemHeart(playerId);
				break;
		}
	}
};

item.prototype.interactItemCoin = function(playerId) {
	if (this.sprite != 'gain') {
		this.gainCoin(playerId);
	}
};

item.prototype.interactItemEgg = function(playerId) {
	if(this.sprite != 'broken')
	{
		this.eggBreak();
	}
};

item.prototype.interactItemStar = function(playerId) {
	if (this.sprite != 'gain') {
		var player = gameEngine.players[playerId];
		player.setStarred(160);
		this.disappearing = false;
		this.sprite = "gain";
		this.disappearsIn = 10;
	}
};

item.prototype.interactItemTnt = function(playerId) {
};

item.prototype.interactItemFish = function(playerId)
{
	// Kick the Fish
	var extraSpeed = 60;
	if(this.starred)
	{
		extraSpeed = 80;
	}
	if(this.speedX > gameEngine.players[playerId].speedX)
	{
		extraSpeed =- extraSpeed;
	}
	var itemId = this.getArrayId();
	gameEngine.items[itemId].speedX = gameEngine.players[playerId].speedX + extraSpeed;
	gameEngine.items[itemId].speedY = -40;
	gameEngine.items[itemId].kicked = 1;
};

item.prototype.interactItemBowlingball = function(playerId) {
	if (gameEngine.players[playerId]) {
		gameEngine.players[playerId].hitByBowlingball(this.getArrayId());
	}
};

item.prototype.interactItemBasketball = function(playerId) {
	if (gameEngine.players[playerId]) {
		gameEngine.players[playerId].hitByBasketball(this.getArrayId());
	}
};

item.prototype.interactItemHeart = function(playerId){
	if (this.sprite != 'gain') {
		if (gameEngine.players[playerId]) {
			gameEngine.players[playerId].lives++;;
		}
		this.disappearing = false;
		this.sprite = "gain";
		this.disappearsIn = 10;
	}
};

item.prototype.spawnCoin = function(x, y, speedX, speedY, disappearsIn, moving) {
	this.setCharacter('coin');
	this.x = x;
	this.y = y;
	this.speedX = speedX;
	if (speedX > 0) {
		this.direction = 'right';
	} else {
		this.direction = 'left';
	}
	this.speedY = speedY;
	this.disappearsIn = disappearsIn;
	this.moving = moving;
};

item.prototype.spawnStar = function(x, y, speedX, speedY, disappearsIn, moving) {
	this.setCharacter('star');
	this.x = x;
	this.y = y;
	this.speedX = speedX;
	this.speedX = speedX;
	if (speedX > 0) {
		this.direction = 'right';
	} else {
		this.direction = 'left';
	}
	this.speedY = speedY;
	this.disappearsIn = disappearsIn;
	this.moving = moving;
};

item.prototype.spawnHeart = function(x, y, speedX, speedY, disappearsIn, moving) {
	this.setCharacter('heart');
	this.x = x;
	this.y = y;
	this.speedX = speedX;
	this.speedX = speedX;
	if (speedX > 0) {
		this.direction = 'right';
	} else {
		this.direction = 'left';
	}
	this.speedY = speedY;
	this.disappearsIn = disappearsIn;
	this.moving = moving;
};

item.prototype.eggBreak = function() {
	if (this.sprite == 'broken') {	
		// You can't break a broken egg
		return;
	}
	if (this.character != 'egg') {
		// Good luck breaking an egg that's not an egg.
		return;
	}
	
	var itemId = this.getArrayId();
	
	
	var itemNew = new item();
	switch (this.itemInside) {
		case 'coin':
			itemNew.spawnCoin(this.x, this.y, this.speedX, -30, 100, false);
			break;
		case 'star':
			itemNew.spawnStar(this.x, this.y, this.speedX, -30, 100, false);
			break;
		case 'heart':
			itemNew.spawnHeart(this.x, this.y, this.speedX, -30, 100, false);
			break;
		default:
			itemNew.spawnCoin(this.x, this.y, this.speedX, -30, 100, false);
			break;
	}
	gameEngine.items.push(itemNew);
	
	this.speedX = 0;
	this.speedY = 0;
	this.sprite = "broken";
	this.disappearing = true;
	this.disappearsIn = 10;
};

item.prototype.tntDrop = function(playerId) {
	if (this.character != 'tnt' || this.sprite == 'explosion') {
		return;
	}
	for (var i in gameEngine.enemies) {
		if (gameEngine.enemies[i] && gameEngine.enemies[i].onFloor && !gameEngine.enemies[i].beingheld) {
			gameEngine.enemies[i].stun();
		}
	}
	
	for (var i in gameEngine.players) {
		if (gameEngine.players[i] && i != playerId && gameEngine.players[i].onFloor && !gameEngine.players[i].beingheld) {
			// Stun/UnStun the player
			if (gameEngine.players[i].stunned) {
				gameEngine.players[i].unStun();
			} else {
				gameEngine.players[i].stun();
			}
		}
	}
	
	this.speedX = 0;
	this.speedY = 0;
	this.sprite = 'explosion';
	this.disappearing = false;
	this.disappearsIn = 10;
};

item.prototype.hitByFloor = function(x,playerId) {
	var itemId = this.getArrayId();
	if (this.character == 'coin' && this.sprite != 'gain') {
		// Gain the coin
		this.speedX = 0;
		this.gainCoin(playerId);
	}
};

item.prototype.gainCoin = function(playerId) {
	if (gameEngine.players[playerId]) {
		this.disappearing = false;
		this.sprite = "gain";
		this.disappearsIn = 10;
		gameEngine.players[playerId].gainCoin();
	}
};

item.prototype.screenEndWarp = function() {
	if (this.y > gameEngine.gameHeight - 512) {
		// Respawn
		if (this.x > gameEngine.gameWidth - 128) {
			// Off the side of the screen
			// Make this item disappear
			var itemId = this.getArrayId();
			gameEngine.items[itemId] = null;
			return;
		}
		if (this.x < 128) {
			// Off the other side of the screen
			// Make this item disappear
			var itemId = this.getArrayId();
			gameEngine.items[itemId] = null;
			return;
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
};

item.prototype.flipDirection = function() {
	if(this.direction == 'right') {
		this.direction = 'left';
		return;
	}
	this.direction = 'right';
};

module.exports = item;