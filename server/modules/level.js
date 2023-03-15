var gameEngine = require('./game-engine.js');
var floor = require('./floor.js');
var trashcan = require('./trashcan.js');
var enemy = require('./enemy.js');

function level(amountOfEnemies) {
	this.id = -1; 
	this.floors = [];
	this.levelWidth = 0;
	this.levelHeight = 0;
	this.trashcans = [];
	this.spawnPoints = [];
	this.playerStartPoints = [];
	this.amountOfEnemies = amountOfEnemies;
	
	var r = Math.floor(Math.random() * 6) + 1;
	if (r == 1 || r == 3 || r == 6) {
		this.generateBasic();
	} else {
		this.generateHard();
	}
};

level.prototype.generateBasic = function() {
	this.id = 0;
	this.levelWidth = 2730;
	this.levelHeight = 2048;
	this.spawnPoints = [];
	this.playerStartPoints = [];
	this.floors = [];
	this.trashcans = [];
	gameEngine.enemies = [];
	
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
	
	// PLAYER START LOCATIONS
	this.playerStartPoints.push({x: 500, y: this.levelHeight - 64 - 256, direction: 'right'});
	this.playerStartPoints.push({x: this.levelWidth - 128 - 500, y: this.levelHeight - 64 - 256, direction: 'left'});
	this.playerStartPoints.push({x: 700, y: this.levelHeight - 512 - 64 - 256, direction: 'right'});
	this.playerStartPoints.push({x: this.levelWidth - 128 - 700, y: this.levelHeight - 512 - 64 - 256, direction: 'left'});
	
	// SPAWNPOINTS
	this.spawnPoints.push({x: -128, y: this.levelHeight - 64 - 512 - 512 - 512 - 128 - 256, direction: 'right'});
	this.spawnPoints.push({x: this.levelWidth - 128, y: this.levelHeight - 64 - 512 - 512 - 512 - 128 - 256, direction: 'left'});
	
	// TRASHCANS
	var t1 = new trashcan();
	t1.setLocation(this.levelWidth/2 - t1.standardTrashcanWidth/2,this.levelHeight - 64 - t1.standardTrashcanHeight);
	this.trashcans.push(t1);
	
	// ENEMIES
	var spawnEnemies = [];
	spawnEnemies.push(this.spawnEnemy('banana'));
	spawnEnemies.push(this.spawnEnemy('robdeprop'));
	spawnEnemies.push(this.spawnEnemy('trashbag'));
	spawnEnemies.push(this.spawnEnemy('robdeprop'));
	spawnEnemies.push(this.spawnEnemy('trashbag'));
	spawnEnemies.push(this.spawnEnemy('robdeprop'));
	spawnEnemies.push(this.spawnEnemy('trashbag'));
	spawnEnemies.push(this.spawnEnemy('robdeprop'));
	spawnEnemies.push(this.spawnEnemy('trashbag'));
	for (var i = 0; i < this.amountOfEnemies; i++) {
		gameEngine.spawnItems.push(spawnEnemies[i]);
	}
};

level.prototype.generateHard = function() {
	this.id = 1;
	this.levelWidth = 2730 * 2;
	this.levelHeight = 2048 * 2;
	this.spawnPoints = [];
	this.playerStartPoints = [];
	this.floors = [];
	this.trashcans = [];
	gameEngine.enemies = [];
	
	// FLOORS
	
	// Ground Left
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
	
	// PLAYER START LOCATIONS
	this.playerStartPoints.push({x: 500, y: this.levelHeight - 64 - 256, direction: 'right'});
	this.playerStartPoints.push({x: this.levelWidth - 128 - 500, y: this.levelHeight - 64 - 256, direction: 'left'});
	this.playerStartPoints.push({x: 700, y: this.levelHeight - 512 - 64 - 256, direction: 'right'});
	this.playerStartPoints.push({x: this.levelWidth - 128 - 700, y: this.levelHeight - 512 - 64 - 256, direction: 'left'});
	
	// SPAWNPOINTS
	this.spawnPoints.push({x: -128, y: this.levelHeight - 64 - 512 - 512 - 512 - 128 - 256, direction: 'right'});
	this.spawnPoints.push({x: this.levelWidth, y: this.levelHeight - 64 - 512 - 512 - 512 - 128 - 256, direction: 'left'});
	
	// TRASHCANS
	var t1 = new trashcan();
	t1.setLocation(this.levelWidth/2 - t1.standardTrashcanWidth/2,this.levelHeight - 64 - t1.standardTrashcanHeight);
	this.trashcans.push(t1);
	
	var t2 = new trashcan();
	t2.setLocation(this.levelWidth/2 - t2.standardTrashcanWidth/2,this.levelHeight - 512 - 512 - 64 - t2.standardTrashcanHeight);
	this.trashcans.push(t2);
	
	// ENEMIES
	var spawnEnemies = [];
	spawnEnemies.push(this.spawnEnemy('banana'));
	spawnEnemies.push(this.spawnEnemy('robdeprop'));
	spawnEnemies.push(this.spawnEnemy('trashbag'));
	spawnEnemies.push(this.spawnEnemy('robdeprop'));
	spawnEnemies.push(this.spawnEnemy('trashbag'));
	spawnEnemies.push(this.spawnEnemy('robdeprop'));
	spawnEnemies.push(this.spawnEnemy('trashbag'));
	spawnEnemies.push(this.spawnEnemy('robdeprop'));
	spawnEnemies.push(this.spawnEnemy('trashbag'));
	for (var i = 0; i < this.amountOfEnemies; i++) {
		gameEngine.spawnItems.push(spawnEnemies[i]);
	}
};

level.prototype.spawnEnemy = function(character) {
	var r = Math.floor(Math.random() * this.spawnPoints.length);
	if (r == this.spawnPoints.length) {
	    --r; //osl Without this, this runs the risk of causing a crash by selecting a spawnpoint which doesn't exist
	    // e.g.
	    // Math.random() = 0 to 1, 1 for this example
	    // spawnPoints.length = 2 for this example
	    // r = floor(1 * 2)
	    // ∴ r = 2
	    // spawnPoints[2] is null
	}
	var spawnPoint = this.spawnPoints[r];
	return new enemy(character, spawnPoint.x, spawnPoint.y, spawnPoint.direction);
};

level.prototype.getPlayerStartPoint = function(num)
{
	return this.playerStartPoints[num - 1];
}

level.prototype.getFloors = function() {
	return this.floors;
};

level.prototype.getTrashCans = function() {
	return this.trashcans;
};

level.prototype.getGameObject = function () {
	var trashcanSender = [];
	for (var i in this.trashcans) {
		trashcanSender.push(this.trashcans[i].getGameObject());
	}
	return {levelId: this.id, trashcans: trashcanSender};
};

module.exports = level;