var gameEngine = require('./game-engine.js');
var item = require('./item.js');

var identifierNum = 1;
function trashcan(x, y) {
	this.character = "trashcan";
	this.sprite = "open";
	this.standardTrashcanHeight = 384;
	this.standardTrashcanWidth = 198;
	this.x = Math.round((gameEngine.gameWidth / 2) - (this.standardTrashcanWidth / 2));
	this.y = gameEngine.gameHeight - 64 - this.standardTrashcanHeight;
	if(x)
	{
		this.x = x;
	}
	if(y)
	{
		this.y = y;
	}
	this.trashcanHeight = 408;
	this.trashcanWidth = 198;
	this.holding = false;
	this.holdingId = 0;
	this.strugglesLeft = 0;
	this.struggleRestricted = 0;
	this.identifier = "Trashcan "+identifierNum;
	this.spriteToClosed = 0;
	this.availableIn = 0;
	this.forceQuit = 0;
	this.ejectCoins = 0;
	this.stayClosed = false;
	identifierNum++;
	
	if (x) {
		this.x = x;
	}
	if (y) {
		this.y = y;
	}
	this.inx = this.x + Math.round(this.trashcanWidth/2) - 64;
};

trashcan.prototype.setLocation = function(x,y)
{
	if (x) {
		this.x = x;
	}
	if (y) {
		this.y = y;
	}
	this.inx = this.x + Math.round(this.trashcanWidth/2) - 64;
}

trashcan.prototype.prepareForGame = function(){
	this.x = Math.round((gameEngine.gameHeight / 2) - (this.standardTrashcanWidth / 2));
	this.y = gameEngine.gameHeight - 64 - standardTrashcanHeight;
	this.strugglesLeft = 0;
	this.struggleRestricted = 0;
	this.availableIn = 0;
	this.spriteToClosed = 0;
	this.sprite = "open";
};

trashcan.prototype.getCharacter = function() {
	return this.character;
};

trashcan.prototype.setCharacter = function(character) {
	this.character = character;
};

trashcan.prototype.available = function() {
	if (!this.holding && !this.availableIn && !this.stayClosed) {
		return true;
	}
	return false;
};

trashcan.prototype.x1 = function(extraMargin) {
	var extraM = 0;
	if(extraMargin)
	{
		extraM = 50;
	}
	return this.x + 18 + 50 - extraM;
};

trashcan.prototype.x2 = function(extraMargin) {
var extraM = 0;
	if(extraMargin)
	{
		extraM = 50;
	}
	return this.x + this.trashcanWidth - 18 - 50 + extraM;
};

trashcan.prototype.y1 = function() {
	return this.y + 128 - 36;
};

trashcan.prototype.getGameObject = function() {
	var holdingUsername = null;
	if (gameEngine.players[this.holdingId]) { 
		holdingUsername = gameEngine.players[this.holdingId].getUsername();
	}
	return {character: this.getCharacter(), x: this.x, y: this.y, width: this.trashcanWidth, height: this.trashcanHeight, sprite: this.sprite, holdingUsername: holdingUsername};
};

trashcan.prototype.update = function() {
	if (this.sprite != "closed")
	{
		if (this.spriteToClosed)
		{
			this.spriteToClosed--;
			if(!this.spriteToClosed)
			{
				console.log('sprite is now CLOSED');
				this.sprite = "closed";
			}
		}
	}
	if (this.struggleRestricted) {
		this.struggleRestricted--;
	}
	if (this.availableIn) {
		if (this.availableIn == 1) {
			// Attempt to open the trashcan
			if (this.canOpen()) {
				this.sprite = "open";
				this.availableIn--;
				while(this.ejectCoins > 0) {
					this.ejectCoins--;
					this.ejectCoin();
				}
			}
		} else {
			this.availableIn--;
		}
	}
	
	if(this.openToRelease < -10)
	{
		this.openToRelease = 0;
		this.sprite = "closed";
		gameEngine.playSound('entertrashcan');
	}
	
	if(this.openToRelease > 0 || this.openToRelease < 0)
	{
		this.openToRelease--;
		if(this.openToRelease == 0)
		{
			this.openToRelease--;
			this.sprite = "open";
			while(this.ejectCoins > 0) {
				this.ejectCoins--;
				this.ejectCoin();
			}
		}
	}
	
	if(this.forceQuit && this.holding)
	{
		this.forceQuit--;
		if(!this.forceQuit)
		{
			// Force the player out of the trashcan
			this.playerLeaves(true);
		}
	}
};

trashcan.prototype.postUpdate = function() {
	
};

trashcan.prototype.playerEnters = function(id,trashcanId) {
	if (!gameEngine.players[id] || !this.available()) {
		return;
	}
	gameEngine.playSound('entertrashcan');
	
	gameEngine.players[id].newRightPress = false;
	gameEngine.players[id].newLeftPress = false;
	gameEngine.players[id].newJumpPress = false;
	gameEngine.players[id].trashcanId = trashcanId;
	gameEngine.players[id].intrashcan = true;
	gameEngine.players[id].dropEntity();
	gameEngine.players[id].unStun();
	gameEngine.players[id].x = this.inx;
	gameEngine.players[id].y = this.y1() + 10;
	gameEngine.players[id].speedY = 0;
	gameEngine.players[id].speedX = 0;
	if(gameEngine.players[id].kicked && gameEngine.players[id].coins > 0)
	{
		gameEngine.players[id].coins--;
		gameEngine.players[id].kicked = false;
		this.openToRelease = 5;
		this.ejectCoins++;
	}
	this.holding = true;
	this.holdingId = id;
	this.strugglesLeft = 5;
	this.struggleRestricted = 20;
	this.forceQuit = 400;
	this.sprite = "closed";
};

trashcan.prototype.playerLeaves = function(force) {
	if (!gameEngine.players[this.holdingId] || !this.holding) {
		return;
	}
	gameEngine.playSound('jump');
	
	gameEngine.players[this.holdingId].x = this.inx;
	gameEngine.players[this.holdingId].y = this.y1() - gameEngine.players[this.holdingId].playerHeight;
	gameEngine.players[this.holdingId].speedY = -80;
	gameEngine.players[this.holdingId].speedX = 0;
	gameEngine.players[this.holdingId].leftTrashCan = true;
	if(force)
	{
		gameEngine.players[this.holdingId].speedX = randomIntFromInterval(40,50);
		var r = randomIntFromInterval(0,1);
		if(r == 1)
		{
			// Force out the other direction
			gameEngine.players[this.holdingId].speedX = -gameEngine.players[this.holdingId].speedX;
		}
	}
	gameEngine.players[this.holdingId].setOutOfTrashcan = true;
	
	var totalChance = 1;
	
	var coinChance = [];
	var starChance = [];
	var heartChance = [];
	var tntChance = [];
	var bowlingballChance = [];
	
	var chosenItem = this.randomTrashcanItem();
	
	if (chosenItem == 'coin' || chosenItem == 'star' || chosenItem == 'heart') {
		this.spawnEgg(chosenItem);
	} else if (chosenItem == 'tnt') {
		this.spawnTnt();
	} else if (chosenItem == 'bowlingball') {
		this.spawnBowlingball();
	} else if (chosenItem == 'basketball') {
		this.spawnBasketball();
	} else {
		this.spawnFish();
	}
	
	this.holding = false;
	this.holdingId = 0;
	this.strugglesLeft = 0;
	this.sprite = "open";
	if(this.stayClosed)
	{
		this.spriteToClosed = 5;
	}
};

trashcan.prototype.randomTrashcanItem = function()
{
	//return 'basketball';
	
	var totalChance = 1;
	if(gameEngine.itemSettings['coin'])
	{
		coinChance = [1,6];
		totalChance = totalChance * coinChance[1];
	}
	if(gameEngine.itemSettings['star'])
	{
		starChance = [1,9];
		totalChance = totalChance * starChance[1];
	}
	if(gameEngine.itemSettings['bowlingball'])
	{
		bowlingballChance = [1,6];
		totalChance = totalChance * bowlingballChance[1];
	}
	if(gameEngine.itemSettings['heart'])
	{
		heartChance = [1,18];
		totalChance = totalChance * heartChance[1];
	}
	if(gameEngine.itemSettings['tnt'])
	{
		tntChance = [1,6];
		totalChance = totalChance * tntChance[1];
	}
	
	var chanceArray = [];
	
	if(gameEngine.itemSettings['coin'])
	{
		chanceArray.push([coinChance[0] * (totalChance / coinChance[1]),'coin']);
	}
	if(gameEngine.itemSettings['star'])
	{
		chanceArray.push([starChance[0] * (totalChance / starChance[1]),'star']);
	}
	if(gameEngine.itemSettings['bowlingball'])
	{
		chanceArray.push([bowlingballChance[0] * (totalChance / bowlingballChance[1]),'bowlingball']);
	}
	if(gameEngine.itemSettings['heart'])
	{
		chanceArray.push([heartChance[0] * (totalChance / heartChance[1]),'heart']);
	}
	if(gameEngine.itemSettings['tnt'])
	{
		chanceArray.push([tntChance[0] * (totalChance / tntChance[1]),'tnt']);
	}
	
	var r = randomIntFromInterval(1,totalChance);
	var chosenItem = null;
	var chanceAdder = 0;
	for(var i in chanceArray)
	{
		if(chanceArray[i][0] + chanceAdder >= r && !chosenItem)
		{
			chosenItem = chanceArray[i][1];
		}
		chanceAdder += chanceArray[i][0];
	}
	if(!chosenItem)
	{
		chosenItem = 'fish';
	}
	return chosenItem;
}


function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

trashcan.prototype.enemyEnters = function(id) {
	if (!this.available()) {
		return;
	}
	gameEngine.playSound('entertrashcan');
	
	gameEngine.enemies[id].intrashcan = true;
	gameEngine.enemies[id].respawnIn = 10;
	gameEngine.enemies[id].x = this.inx;
	gameEngine.enemies[id].y = this.y1() + 10;
	gameEngine.enemies[id].speedX = 0;
	gameEngine.enemies[id].speedY = 0;
	gameEngine.enemies[id].angle = 0;
	this.availableIn = 30;
	this.ejectCoins += 2;
	this.sprite = "closed";
};

trashcan.prototype.itemEnters = function(id) {
	if (!this.available()) {
		return;
	}
	gameEngine.playSound('entertrashcan');
	
	gameEngine.items[id].intrashcan = true;
	gameEngine.items[id].disappearsIn = 5;
	gameEngine.items[id].x = this.inx;
	gameEngine.items[id].y = this.y1() + 10;
	gameEngine.items[id].speedX = 0;
	gameEngine.items[id].speedY = 0;
	gameEngine.items[id].angle = 0;
	this.availableIn = 50;
	this.sprite = "closed";
};

trashcan.prototype.canOpen = function(byForce) {
	var canExit = true;
	for (var i in gameEngine.players) {
		if (gameEngine.players[i] && !gameEngine.players[i].intrashcan && this.x1() < gameEngine.players[i].x + gameEngine.players[i].playerWidth && this.x2() > gameEngine.players[i].x && gameEngine.players[i].y + gameEngine.players[i].playerHeight == this.y1() && gameEngine.players[i].lives > 0) {
			// Somebody is standing on the trashcan
			if (byForce) {
				gameEngine.players[i].speedY = -15;
				if (gameEngine.players[i].x + Math.round(gameEngine.players[i].playerWidth / 2) > this.x + Math.round(this.trashcanWidth / 2)) {
					gameEngine.players[i].speedX += 20;
				} else {
					gameEngine.players[i].speedX -= 20;
				}
			}
			canExit = false;
		}
	}
	return canExit;
};

trashcan.prototype.struggle = function(direction) {
	if (this.struggleRestricted) {
		return;
	}
	this.struggleRestricted = 6;
	if (this.strugglesLeft) {
		this.strugglesLeft--;
	}
	gameEngine.playSound('struggletrashcan');
	if (!this.strugglesLeft && direction == 'jump') {
		if (this.canOpen(true)) {
			this.playerLeaves();
			return;
		}
	}
	
	console.log(this.strugglesLeft + ' struggles left');
	
	// Show the animation
	var rand = 0;
	if (direction == 'jump') {
		rand = Math.floor(Math.random() * 2) + 1;
	}
	if (direction == 'left' || rand == 1) {
		this.sprite = "hit_left";
	}
	if (direction == 'right' || rand == 2) {
		this.sprite = "hit_right";
	}
	console.log('sprite is now ' + this.sprite + ' because direction is ' + direction);
	this.spriteToClosed = 5;
	
};

trashcan.prototype.holderQuits = function() {
	this.holding = false;
	this.holdingId = 0;
	this.sprite = "open";
};

trashcan.prototype.spawnEgg = function(character) {
	var egg = new item();
	egg.setCharacter('egg');
	egg.itemInside = character;
	gameEngine.items.push(egg);
	var itemId = egg.getArrayId();
	gameEngine.players[this.holdingId].holding = true;
	gameEngine.players[this.holdingId].holdingId = itemId;
	gameEngine.players[this.holdingId].holdingType = 'item';
	gameEngine.players[this.holdingId].holdticksLeft = 200;
	egg.beingheld = true;
	egg.beingheldId = this.holdingId;
	egg.speedX = 0;
	egg.speedY = 0;
};

trashcan.prototype.spawnTnt = function() {
	var tnt = new item();
	tnt.setCharacter('tnt');
	gameEngine.items.push(tnt);
	var itemId = tnt.getArrayId();
	gameEngine.players[this.holdingId].holding = true;
	gameEngine.players[this.holdingId].holdingId = itemId;
	gameEngine.players[this.holdingId].holdingType = 'item';
	gameEngine.players[this.holdingId].holdticksLeft = 200;
	tnt.kicker = this.holdingId;
	tnt.beingheld = true;
	tnt.beingheldId = this.holdingId;
	tnt.speedX = 0;
	tnt.speedY = 0;
};

trashcan.prototype.spawnFish = function() {
	var fish = new item();
	fish.setCharacter('fish');
	gameEngine.items.push(fish);
	var itemId = fish.getArrayId();
	gameEngine.players[this.holdingId].holding = true;
	gameEngine.players[this.holdingId].holdingId = itemId;
	gameEngine.players[this.holdingId].holdingType = 'item';
	gameEngine.players[this.holdingId].holdticksLeft = 200;
	fish.beingheld = true;
	fish.beingheldId = this.holdingId;
	fish.speedX = 0;
	fish.speedY = 0;
};

trashcan.prototype.spawnBowlingball = function() {
	var bowlingball = new item();
	bowlingball.setCharacter('bowlingball');
	gameEngine.items.push(bowlingball);
	var itemId = bowlingball.getArrayId();
	gameEngine.players[this.holdingId].holding = true;
	gameEngine.players[this.holdingId].holdingId = itemId;
	gameEngine.players[this.holdingId].holdingType = 'item';
	gameEngine.players[this.holdingId].holdticksLeft = 200;
	bowlingball.moving = true;
	bowlingball.beingheld = true;
	bowlingball.beingheldId = this.holdingId;
	bowlingball.speedX = 0;
	bowlingball.speedY = 0;
};

trashcan.prototype.spawnBasketball = function() {
	var basketball = new item();
	basketball.setCharacter('basketball');
	gameEngine.items.push(basketball);
	var itemId = basketball.getArrayId();
	gameEngine.players[this.holdingId].holding = true;
	gameEngine.players[this.holdingId].holdingId = itemId;
	gameEngine.players[this.holdingId].holdingType = 'item';
	gameEngine.players[this.holdingId].holdticksLeft = 200;
	basketball.moving = true;
	basketball.beingheld = true;
	basketball.beingheldId = this.holdingId;
	basketball.speedX = 0;
	basketball.speedY = 0;
};

trashcan.prototype.spawnCoin = function() {
	var coin = new item();
	coin.setCharacter('coin');
	gameEngine.items.push(coin);
	var itemId = coin.getArrayId();
	gameEngine.players[this.holdingId].holding = true;
	gameEngine.players[this.holdingId].holdingId = itemId;
	gameEngine.players[this.holdingId].holdingType = 'item';
	gameEngine.players[this.holdingId].holdticksLeft = 200;
	coin.beingheld = true;
	coin.beingheldId = this.holdingId;
	coin.speedX = 0;
	coin.speedY = 0;
};

trashcan.prototype.ejectCoin = function() {
	var speedX = 30;
	var spawnSpeedX = Math.floor(Math.random() * 20) + 20;
	var spawnDirection = Math.floor(Math.random() * 2) + 1;
	if (spawnDirection == 2) {
		spawnSpeedX = -spawnSpeedX;
	}
	
	var spawnSpeedY = -(Math.floor(Math.random() * 40) + 60);
	
	var coin = new item();
	coin.spawnCoin(this.x1(), this.y1() - coin.standardItemHeight, spawnSpeedX, spawnSpeedY, 100, false);
	gameEngine.items.push(coin);
};

module.exports = trashcan;