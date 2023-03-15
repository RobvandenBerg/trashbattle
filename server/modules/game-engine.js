var playerSelection = require('./playerselection.js');
var mysql_query = require('./mysql.js');

var gameEngine = {
	state: "lobby",
	players: [],
	enemies: [],
	items: [],
	spawnItems: [],
	floorHitpoints: [],
	spawnItemTime: 0,
	gameWidth: 2730,
	gameHeight: 2048,
	host: 0,
	loopNumber: 0,
	maxPlayers: 4,
	guests: false,
	gameStarting: false,
	gameStarts: 0,
	secondsLeft: 0,
	scoreState: 'begin',
	maxCoins: 10,
	nextMaxCoins: 10,
	lives: 3,
	nextLives: 3,
	maxScore: 5,
	nextMaxScore: 5,
	packetId: 0,
	difficulty: 'medium',
	nextDifficulty: 'medium',
	itemSettings: {coin: 1, bowlingball: 1, star: 1, heart: 1, tnt: 1},
	nextItemSettings: {coin: 1, bowlingball: 1, star: 1, heart: 1, tnt: 1},
	mysqlid: 0,
	ticktime: 50,
	emitCallback: null,
	shutdownCallback: null,
	level: null,
	playerselection: playerSelection,
	lastDeath: 0,
	round: 0,
	surviveTime: 5000,
	gameEndReason: null,
	scorePlayes: [],
	sounds: [],
	won: null,
	pausedState: 0,
	showingGoal: 0,
	
	//
	// GETTERS AND SETTERS
	//
	getPlayers: function() {
		return this.players;
	},
	
	setMySQLId: function(id) {
		this.mysqlid = id;
	},
	
	getHost: function() {
		return this.host;
	},
	setHost: function(newHost) {
		this.host = newHost;
	},
	
	getMaxPlayers: function() {
		return this.maxPlayers;
	},
	setMaxPlayers: function(number) {
		this.maxPlayers = number;
		var playersTooMuch = this.amountOfPlayers() - this.maxPlayers;
		while (playersTooMuch > 0 && this.state == 'lobby') {
			// Throw out the last player
			this.leave(this.players[this.players.length - 1].socketid);
			playersTooMuch--;
		}
	},
	
	getGuests: function() {
		return this.guests;
	},
	setGuests: function(bool) {
		this.guests = bool;
	},
	
	//
	// GAME FUCTIONS
	//
	startGame: function() {
		this.spawnItems = [];
		this.spawnItemTime = 0;
		this.items = [];
		this.enemies = [];
		var amountOfEnemies = 2;
		if(this.difficulty == 'easy')
		{
			if(this.amountOfPlayers() == 2)
			{
				amountOfEnemies = 4;
			}
			else if(this.amountOfPlayers() == 3)
			{
				amountOfEnemies = 3;
			}
			else
			{
				amountOfEnemies = 2;
			}
		}
		if(this.difficulty == 'medium')
		{
			if(this.amountOfPlayers() == 2)
			{
				amountOfEnemies = 6;
			}
			else if(this.amountOfPlayers() == 3)
			{
				amountOfEnemies = 5;
			}
			else
			{
				amountOfEnemies = 4;
			}
		}
		if(this.difficulty == 'hard')
		{
			if(this.amountOfPlayers() == 2)
			{
				amountOfEnemies = 8;
			}
			else if(this.amountOfPlayers() == 3)
			{
				amountOfEnemies = 7;
			}
			else
			{
				amountOfEnemies = 6;
			}
		}
		console.log('THERE ARE '+ this.amountOfPlayers()+' PLAYAS AND DIFFICULTY IS ' + this.difficulty + ' and there will be ' + amountOfEnemies + ' enemies');
		this.level = new level(amountOfEnemies);
		console.log('new level created. spawnItems is:');
		console.log(this.spawnItems);
		this.gameWidth = this.level.levelWidth;
		this.gameHeight = this.level.levelHeight;
		this.floorHitpoints = [];
		this.state = 'game';
		this.showingGoal = 60;
		this.lastDeath = 0;
		this.pausedState = 0;
		this.won = null;
		this.round++;
		var startPointNum = 0;
		for (var i in this.players) {
			if (this.players[i]) {
				this.players[i].setPlayerNumber(parseInt(i)+1);
				startPointNum++;
				var startPoint = this.level.getPlayerStartPoint(startPointNum);
				this.players[i].prepareForGame(startPoint.x,startPoint.y,startPoint.direction,this.lives);
			}
		}
	},
	join: function(playerObject) {
		if (this.state != 'lobby' || this.amountOfPlayers() >= this.maxPlayers) {
			return false;
		}
		for (var i in this.players) {
			if (this.players[i].username == playerObject.username) {
				return false;
			}
		}
		var olaiSplit = playerObject.username.split('*OLAI-');
		if (!this.guests && playerObject.guest && olaiSplit.length < 2) {
			return false;
		}
		this.players.push(playerObject);
		this.updatePlayersInDatabase();
		this.sendCurrentState();

		return true;
	},
	leave: function(socketid, force) {
		for (var i in this.players) {
			if (this.players[i] && this.players[i].socketid == socketid) {
				var deletedPlayerUsername = this.players[i].username;
				if (this.state == 'game') {
					// Insert an empty place for the left player so id's dont mix up
					this.players[i].prepareForQuit(i);
					this.players.splice(i,1,null);
				} else {
					this.players.splice(i,1);
				}
				this.updatePlayersInDatabase();
				if (this.state == 'lobby' && this.gameStarting && this.amountOfPlayers() < 2) {
					this.gameStarting = false;
					this.gameStarts = 0;
				} else if (this.state == 'playerselection' && this.amountOfPlayers() >= 2) {
					// Continue but remove a player from the player selection
					this.playerselection.removePlayer(deletedPlayerUsername,force);
				} else if (this.state != 'lobby' && this.state != 'score' && this.amountOfPlayers() < 2) {
					// Go back to the lobby
					console.log('Not enough players left to continue, let\'s go back to the lobby');
					this.state = 'lobby';
					this.organizePlayers();
					this.gameStarting = false;
					this.gameStarts = 0;
				}
				
				console.log('sending state');
				this.sendCurrentState();
			}
		}
	},
	
	//
	// PLAYERS FUNCTIONS
	//
	amountOfPlayers: function() {
		var amount = 0;
		for (var i in this.players) {
			if (this.players[i]) {
				amount++;
			}
		}
		return amount;
	},
	organizePlayers: function() {
		var newplayers = [];
		for (var i in this.players) {
			if (this.players[i]) {
				newplayers.push(this.players[i]);
			}
		}
		this.players = newplayers;
	},
	updatePlayersInDatabase: function() {
		var amountOfPlayers = this.amountOfPlayers();
		var shutdownCallback = this.shutdownCallback;
		var mysqlid = this.mysqlid;
		var resultFunction = function () {
			console.log('UPDATED THE AMOUNT OF USERS IN THE DATABASE');
		}
		mysql_query(
			'UPDATE trashbattle.games set players='+ amountOfPlayers + ' where id=' + mysqlid,
			function(){shutdownCallback(1, "MySQL error")},
			true,
			resultFunction
		);
	},
	
	//
	// INPUT FUNCTIONS
	//
	inputDown: function(socketid,keyFunction) {
		if (keyFunction != 'left' && keyFunction != 'right' && keyFunction != 'jump' && keyFunction != 'hold') {
			// Invalid key function
			return;
		}
		for (var i in this.players) {
			if (this.players[i] && this.players[i].socketid == socketid) {
				this.players[i].inputDown(keyFunction);
			}
		}	
	},
	inputUp: function(socketid,keyFunction) {
		if (keyFunction != 'left' && keyFunction != 'right' && keyFunction != 'jump' && keyFunction != 'hold') {
			// Invalid key function
			return;
		}
		for (var i in this.players) {
			if (this.players[i] && this.players[i].socketid == socketid) {
				this.players[i].inputUp(keyFunction);
			}
		}	
	},
	
	//
	//	SELECTIONSCREEN FUNCTIONS
	//
	startCountdown: function(socketid) {
		// Start the countdown to start the actual game
		if (this.gameStarting || this.amountOfPlayers() < 2) {
			return;
		}
		var hasRight = false;
		for (var i in this.players) {
			if (this.players[i].socketid == socketid) {
				// The person who requests starting the game is a joined player!
				hasRight = true;
			}
		}
		if (!hasRight) {
			return;
		}
		this.gameStarting = true;
		this.gameStarts = Math.round(new Date().getTime() + 5000);
		this.sendCurrentState();
	},
	hoverCharacter: function(socketid,x,y)
	{
		if(this.state != 'playerselection')
		{
			return;
		}
		for(var i in this.players)
		{
			if(this.players[i].socketid == socketid)
			{
				this.playerselection.hoverPlayer(this.players[i].getUsername(),x,y);
			}
		}
	},
	selectCharacter: function(socketid,x,y)
	{
		if(this.state != 'playerselection')
		{
			return;
		}
		for(var i in this.players)
		{
			if(this.players[i].socketid == socketid)
			{
				this.playerselection.selectPlayer(this.players[i].getUsername(),x,y);
			}
		}
	},
	unselectCharacter: function(socketid,x,y)
	{
		if(this.state != 'playerselection')
		{
			return;
		}
		for(var i in this.players)
		{
			if(this.players[i].socketid == socketid)
			{
				this.playerselection.unselectPlayer(this.players[i].getUsername());
			}
		}
	},
	
	//
	// SOUND
	//	
	playSound: function(soundName)
	{
		this.sounds.push(soundName);
	},
	
	//
	// TICK
	//
	tick: function(thisTickTime) {
		var currentTime = new Date().getTime();
		
		// GAME
		if (this.state == 'game') {
			this.sounds = [];
		
			// First check if the game has already ended
			if (!this.pausedState) {
				var playersAlive = [];
				var hasEnoughCoins = false;
				for (var i in this.players) {
					if (this.players[i] && !this.players[i].dead) {
						playersAlive.push(i);
						if (this.players[i].coins >= this.maxCoins && this.players[i].canWin()) {
							hasEnoughCoins = true;
							this.won = this.players[i].getUsername();
							this.players[i].win();
							for(var j in this.players)
							{
								if(j != i && this.players[j])
								{
									this.players[j].lose();
								}
							}
							for(var j in this.enemies)
							{
								if(this.enemies[j])
								{
									this.enemies[j].pause();
								}
							}
							this.sendCurrentState();
							this.pausedState = 100;
							break;
						}
					}
				}
				if (!hasEnoughCoins && (playersAlive.length == 0 || (playersAlive.length == 1 && (this.lastDeath && this.lastDeath + this.surviveTime < currentTime)))) {
					var canEnd = true;
					if (playersAlive.length == 1) {
						for(var i in this.level.trashcans)
						{
							if(this.level.trashcans[i])
							{
								this.level.trashcans[i].stayClosed = true;
							}
						}
						canEnd = this.players[playersAlive[0]].canWin();
						if (canEnd) {
							this.won = this.players[playersAlive[0]].getUsername();
							this.players[playersAlive[0]].win();
							console.log('prizecoins for '+this.won+' is now '+this.players[playersAlive[0]].prizeCoins);
							for(var j in this.enemies)
							{
								if(this.enemies[j])
								{
									this.enemies[j].pause();
								}
							}
							this.sendCurrentState();
						}
					}
					if (canEnd) {
						this.pausedState = 100;
					}
				}
			} else {
				// The game has ended and is in pause mode
				this.pausedState--;
				if (!this.pausedState) {
					// Game has ended for real, go back to the score screen
					this.state = 'score';
					this.gameEndReason = null;
					this.organizePlayers();
					this.scorePlayers = [];
					var scoreArray = [];
					
					var updateCoinsQueryCasePart = "";
					var updateCoinsQueryInPart = "";
					
					for(var i in this.players)
					{
						if(this.players[i])
						{
							var score = this.players[i].totalScore;
							if(this.won == this.players[i].username)
							{
								// You get at least five coins when you win
								console.log(this.won + ' gets minumum 5 coins for winning');
								this.players[i].coins = Math.max(this.players[i].coins,5);
								if(score == this.maxScore)
								{
									// You get bonus coins for winning
									this.players[i].coins += this.players[i].prizeCoins;
									console.log('Winner got ' + this.players[i].prizeCoins + ' prize Coins');
								}
							}
							if(!this.players[i].isGuest())
							{
								// Update score in the database
								updateCoinsQueryCasePart += "WHEN " + this.players[i].getUserId() + " THEN `coins` + " + this.players[i].coins + " ";
								if(updateCoinsQueryInPart != "") {
									updateCoinsQueryInPart += ",";
								}
								updateCoinsQueryInPart += this.players[i].getUserId();
							}
							
							var exists = false;
							for(var j in scoreArray)
							{
								if(scoreArray[j] == score)
								{
									exists = true;
								}
							}
							if(!exists)
							{
								scoreArray.push(score);
							}
							if(score == this.maxScore)
							{
								this.gameEndReason = 'somebodyWon';
								console.log('SOMEBODY WOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOON');
							}
						}
					}
					scoreArray.sort();
					scoreArray.reverse();
					for(var i in this.players)
					{
						if(this.players[i])
						{
							var score = this.players[i].totalScore;
							var place = 0;
							var showWinBin = true;
							var expression = 'normal';
							for(var j in scoreArray)
							{
								if(scoreArray[j] == score && place == 0)
								{
									// This player is now the (j+1)th best player in the match
									place = parseInt(j)+1;
									if(this.gameEndReason == 'somebodyWon')
									{
										if(j == 0)
										{
											// In first place!
											expression = 'happy';
										}
										if(j == scoreArray.length - 1)
										{
											// Last place...
											expression = 'sad';
											showWinBin = false;
										}
									}
								}
							}
							this.players[i].place = place;
							var scoreObject = this.players[i].getScoreObject();
							
							this.players[i].coinsUser += this.players[i].coins;
							
							this.players[i].getUserObject().coins = this.players[i].coinsUser;
							this.players[i].getUserObject().ranking = this.players[i].ranking;
							
							console.log('New coins user: '+this.players[i].getUserObject().coins);
							
							scoreObject.rankingGained = 0;
							if(this.gameEndReason == 'somebodyWon')
							{
								scoreObject.expression = expression;
								scoreObject.showWinBin = showWinBin;
							}
							this.scorePlayers.push(scoreObject);
						}
					}
					if(updateCoinsQueryCasePart != '' && updateCoinsQueryInPart != '')
					{
						var updateCoinsQuery = "UPDATE `users` set `coins` = CASE `id` " + updateCoinsQueryCasePart + " ELSE `coins` END WHERE `id` IN(" +updateCoinsQueryInPart + ")";
						mysql_query(updateCoinsQuery);
					}
					
					this.scoreState = 0;
					this.gameStarting = false;
					this.gameStarts = currentTime + 20000;
					this.sendCurrentState();
					
					/*
					this.state = 'lobby';
					this.organizePlayers();
					this.sendCurrentState();
					this.gameStarting = false;
					this.gameStarts = 0;
					*/
				}
			}
			if(this.showingGoal)
			{
				this.showingGoal--;
				this.sendCurrentState();
			}
			if (!this.pausedState && !this.showingGoal && this.state == 'game') {
				// Update the game
				if (this.spawnItems.length > 0 && !this.spawnItemTime) {
					console.log(this.spawnItems);
					var item = this.spawnItems.shift();
					if (item.standardEnemyHeight) {
						this.enemies.push(item);
					} else if (item.standardItemHeight) {
						this.items.push(item);
					}
					this.spawnItemTime = 50;
				}
				
				if (this.spawnItemTime) {
					this.spawnItemTime--;
				}
				
				this.floorHitpoints = [];
				
				this.playerUpdate();
				this.enemyUpdate();
				this.itemUpdate();
				this.trashcanUpdate();
				this.playerPostUpdate();
				this.enemyPostUpdate();
				this.itemPostUpdate();
				this.trashcanPostUpdate();
				
				this.sendCurrentState();
			}
		}
		
		// LOBBY
		if (this.state == "lobby") {
			if (this.gameStarting) {
				if (currentTime > this.gameStarts) {
					// Let's start the game and go to the player selection screen
					this.round = 0;
					this.state = "playerselection";
					this.maxCoins = this.nextMaxCoins;
					this.lives = this.nextLives;
					this.maxScore = this.nextMaxScore;
					this.difficulty = this.nextDifficulty;
					this.itemSettings = this.nextItemSettings;
					this.gameStarting = false;
					this.gameStarts = Math.round(currentTime + 20000);
					// Player selection ends in maximum 20 seconds
					var usernamesList = [];
					for(var i in this.players)
					{
						this.players[i].prizeCoins = 0;
						usernamesList.push(this.players[i].getUsername());
					}
					this.playerselection.startSelection(usernamesList);
				}
				var newSecondsLeft = Math.ceil(((this.gameStarts - currentTime) / 1000));
				if (newSecondsLeft != this.secondsLeft) {
					this.secondsLeft = newSecondsLeft;
					this.sendCurrentState();
				}
			}
		}
		
		// PLAYER SELECTION
		if (this.state == 'playerselection') {
			if (currentTime < this.gameStarts && this.playerselection.everybodyChose()) {
				// Time is not yet up, but everybody has chosen already
				this.gameStarts = currentTime;
			}
			if (this.gameStarting) {
				if (currentTime >= this.gameStarts) {
					// Let's start the game and update the state to "game"
					//this.state = "game";
					
					// Cut off the player selection
					this.playerselection.cutOff();
					this.gameStarting = false;
				}
				var newSecondsLeft = Math.ceil((this.gameStarts - currentTime) / 1000);
				if (newSecondsLeft != this.secondsLeft) {
					this.secondsLeft = newSecondsLeft;
					this.sendCurrentState();
				}
			} else if (currentTime > (this.gameStarts + 2000)) {
				this.gameStarting = false;
				this.gameStarts = 0;
				// Get the chosen characters
				var chosenCharacters = this.playerselection.cutOff();
				for (var i in chosenCharacters) {
					for (var j in this.players) {
						if (chosenCharacters[i][0] == this.players[j].getUsername()) {
							// Set the chosen character
							this.players[j].setCharacter(chosenCharacters[i][1]);
							this.players[j].totalScore = 0;
						}
					}
				}
				
				this.round = 0;
				this.startGame();
				this.sendCurrentState();
			} else {
				if (currentTime > (this.gameStarts - 10000) && currentTime < this.gameStarts) {
					// Game starts in less then 10 seconds, let's show everyone the game is about to start
					this.gameStarting = true;
					this.sendCurrentState();
				}
			}
		}
		
		// SCORE BOARD
		if (this.state == 'score') {
			
			if(this.scoreState > 8 && currentTime > this.gameStarts - 5000 && this.gameEndReason != 'lackOfPlayers' && this.gameEndReason != 'somebodyWon' && this.amountOfPlayers() < 2)
			{
				// There are not enough players left to continue
				console.log('not enough players left, changing state to lackOfPlayers');
				this.gameEndReason = 'lackOfPlayers';
				this.gameStarts = currentTime + 5000;
				this.sendCurrentState();
			}
			if(currentTime > this.gameStarts && this.gameEndReason)
			{
				// Let's go back to the lobby
				this.state = 'lobby';
				this.organizePlayers();
				this.sendCurrentState();
				this.gameStarting = false;
				this.gameStarts = 0;
			}
			
			if (currentTime > this.gameStarts + 2000 && !this.gameEndReason) {
				// Screen end, start the next game
				this.startGame();
				this.sendCurrentState();
			}
			else if (currentTime > this.gameStarts && !this.gameEndReason) {
				// Get ready
				if (this.scoreState != 11) {
					this.gameStarting = false;
					this.scoreState = 11;
					this.sendCurrentState();
				}
			}
			else if (currentTime > this.gameStarts - 5000 && !this.gameEndReason) {
				this.gameStarting = true;
				this.scoreState = 10;
				var newSecondsLeft = Math.ceil((this.gameStarts - currentTime) / 1000);
				if (newSecondsLeft != this.secondsLeft) {
					this.secondsLeft = newSecondsLeft;
					this.sendCurrentState();
				}
			} else if (currentTime > this.gameStarts - 19000) {
				for (var i = 1; i <= 9; i++) {
					var measureTime = 20000 - i * 1000;
					if (currentTime > this.gameStarts - measureTime && this.scoreState < i) {
						this.scoreState = i;
						this.sendCurrentState();
					}
				}
			}
		}
	
		var nextTickTime = thisTickTime + this.ticktime;
		setTimeout(function() {gameEngine.tick(nextTickTime)}, nextTickTime - new Date().getTime());
	},
	
	//
	// PLAYER
	//
	playerUpdate: function() {
		for(var i in this.players) {
			if (this.players[i]) {
				this.players[i].update();
				for (var j in this.players) {
					if (this.players[j]) {
						if (this.players[i].lives > 0 && this.players[j].lives > 0 && !this.players[i].beingheld && !this.players[j].beingheld && !this.players[i].beingheld && !this.players[i].intrashcan && !this.players[j].intrashcan) {
							var collision = false;
							if (i != j) {
								collision = this.isCollide(this.players[i], this.players[j]);
							}
							if (collision && (!this.players[i].starred == !this.players[j].starred)) {
								var speedI = this.players[i].speedX;
								var speedJ = this.players[j].speedX;
								if (this.players[i].lasty - (this.players[j].lasty + this.players[j].playerHeight) > 0 || this.players[j].lasty - (this.players[i].lasty + this.players[i].playerHeight) > 0) {
									// Somebody is jumping on somebody elses head
									if (this.players[i].lasty <= this.players[j].lasty) {
										// Player i jumps on player j
										var jumpPoint = this.players[j].y;
										var underPlayerPoint = jumpPoint;
										var floors = this.level.getFloors();
										for(var k in floors)
										{
											if (floors[k].x < this.players[i].x + this.players[i].playerWidth && floors[k].x + floors[k].width > this.players[i].x && jumpPoint - this.players[i].playerHeight < floors[k].y + 64 && this.players[i].y >= floors[k].y + 64)
											{
												// Player i would go through the wall above him, which is not allowed, so let's change the jumpPoint
												console.log('go through wall');
												jumpPoint = this.players[i].y + this.players[i].playerHeight + 1;
												underPlayerPoint = jumpPoint;
												if(jumpPoint + this.players[j].playerHeight > this.level.levelHeight - 60)
												{
													// Players can't both fit in here
													underPlayerPoint = this.players[j].y;
													this.players[j].x = this.players[i].x + this.players[i].playerWidth;
												}
											}
										}
										this.players[i].y = jumpPoint - this.players[i].playerHeight;
										this.players[i].speedY = -100;
										this.players[j].y = underPlayerPoint;
										this.players[j].speedY = 100;
										this.players[j].stun();
									} else {
										// Player j jumps on player i
										var jumpPoint = this.players[i].y;
										var underPlayerPoint = jumpPoint;
										var floors = this.level.getFloors();
										for(var k in floors)
										{
											if (floors[k].x < this.players[j].x + this.players[j].playerWidth && floors[k].x + floors[k].width > this.players[j].x && jumpPoint - this.players[j].playerHeight < floors[k].y + 64 && this.players[j].y >= floors[k].y + 64)
											{
												// Player i would go through the wall above him, which is not allowed, so let's change the jumpPoint
												console.log('go through wall here');
												jumpPoint = this.players[j].y + this.players[j].playerHeight + 1;
												underPlayerPoint = jumpPoint;
												if(jumpPoint + this.players[i].playerHeight > this.level.levelHeight - 60)
												{
													// Players can't both fit in here
													underPlayerPoint = this.players[i].y;
													this.players[i].x = this.players[j].x + this.players[j].playerWidth;
												}
											}
										}
										this.players[i].y = underPlayerPoint;
										this.players[i].speedY = 100;
										this.players[j].y = jumpPoint - this.players[j].playerHeight;
										this.players[j].speedY = -100;
										this.players[i].stun();
									}
								} else if (this.players[i].stunned == this.players[j].stunned) {
									// They are colliding from the side
									var collisionPowerX = speedI - speedJ;
									var excaggerationX = 10;
									collisionPowerX += Math.round((collisionPowerX + excaggerationX)/2);
									
									var midX = Math.round((this.players[i].x + this.players[j].x) / 2);
									
									if (this.players[i].speedX >= this.players[j].speedX) {
										this.players[i].x = midX - 64;
										this.players[j].x = midX + 64;
									} else {
										this.players[i].x = midX + 64;
										this.players[j].x = midX - 64;
									}
									this.players[i].speedX -= collisionPowerX;
									this.players[j].speedX += collisionPowerX;
								} else if (!this.players[i].stunned && this.players[j].stunned) {
									// Player i kicks/ picks up player j
									this.players[i].interactPlayer(j);
								} else if (!this.players[j].stunned && this.players[i].stunned) {
									// Player j kicks/ picks up player i
									this.players[j].interactPlayer(i);
								}
							} else if (collision) {
								if (this.players[i].starred) {
									this.players[j].hitByEnemy();
								} else if (this.players[j].starred) {
									this.players[i].hitByEnemy();
								}
							}
						}
					}
				}
			}
		}
	},
	
	playerPostUpdate: function() {
		for (var i in this.players) {
			if (this.players[i]) {
				this.players[i].postUpdate();
			}
		}
	},
	
	//
	// ENEMY
	//
	enemyUpdate: function() {
		for (var i in this.enemies) {
			if(this.enemies[i] && !this.enemies[i].beingheld)
			{
				this.enemies[i].update();
				if (this.enemies[i] && !this.enemies[i].beingheld && this.enemies[i].kicked < 2)
				{
					for (var j in this.enemies) {
						if(this.enemies[j] && !this.enemies[j].beingheld)
						{
							var collision = false;
							if (i != j) {
								var a = this.enemies[i];
								var b = this.enemies[j];
								collision = this.isCollide(a, b);
							}
							if (collision) {
								var midX = 0;
								var newIDirection = 'left';
								var newJDirection = 'left';
								if((this.enemies[i].speedX >= 0 && this.enemies[j].speedX >= 0) || (this.enemies[i].speedX <= 0 && this.enemies[j].speedX <= 0))
								{
									// They are moving in the same direction
									if (Math.abs(this.enemies[i].speedX) >= Math.abs(this.enemies[j].speedX)) {
										if(this.enemies[i].speedX > 0)
										{
											midX = this.enemies[j].x - 64;
										}
										else
										{
											midX = this.enemies[j].x + 64;
										}
									}
									else
									{
										
										if(this.enemies[j].speedX > 0)
										{
											midX = this.enemies[i].x - 64;
										}
										else
										{
											midX = this.enemies[i].x + 64;
										}
									}
								}
								else
								{
									midX = Math.round((this.enemies[i].x + this.enemies[j].x) / 2);
								}
								if (this.enemies[i].speedX >= this.enemies[j].speedX) {
									this.enemies[i].x = midX - 64;
									this.enemies[j].x = midX + 64;
									newJDirection = 'right';
								} else {
									this.enemies[i].x = midX + 64;
									this.enemies[j].x = midX - 64;
									newIDirection = 'right';
								}
								this.enemies[i].flipDirection(newIDirection);
								this.enemies[j].flipDirection(newJDirection);
							}
						}
					}
					for (var j in this.players) {
						if (this.players[j] && !this.players[j].intrashcan && !this.enemies[i].intrashcan && this.players[j].lives > 0 && !this.players[j].beingheld) {
							var a = this.enemies[i];
							var b = this.players[j];
							var	collision = this.isCollide(a, b);
							if (collision) {
								if (!this.enemies[i].stunned) {
									if (!this.players[j].invincibility && !this.players[j].starred && !this.players[j].lives <= 0) {
										this.enemies[i].flipDirection();
										this.players[j].hitByEnemy();
									} else if (this.players[j].starred && !this.players[j].lives <= 0) {
										this.enemies[i].interactEnemy(j,true);
									}
								} else {
									this.enemies[i].interactEnemy(j);
								}
							}
						}
					}
				}
			}
		}
	},
	
	enemyPostUpdate: function() {
		for (var i in this.enemies) {
			if (this.enemies[i]) {
				this.enemies[i].postUpdate();
			}
		}
	},
	
	//
	// ITEM
	//
	itemUpdate: function() {
		for (var i in this.items) {
			if (this.items[i]) { 
				this.items[i].update();
				for (var j in this.players) {
					if(this.items[i] && this.players[j] && !this.items[i].intrashcan && !this.players[j].intrashcan && !this.items[i].beingheld && this.players[j].lives > 0) {
						var a = this.items[i];
						var b = this.players[j];
						var	collision = this.isCollide(a, b);
						if (collision && (!b.holding || b.holdingId != i || b.holdingType != 'item')){
							a.interactItem(j);
						}
					}
				}
				
				if(this.items[i] && this.items[i].character == 'bowlingball')
				{
					// A bowlingball interacts with enemies
					for (var j in this.enemies) {
						if(this.items[i] && this.enemies[j] && !this.items[i].intrashcan && !this.enemies[j].intrashcan && !this.items[i].beingheld) {
							var a = this.items[i];
							var b = this.enemies[j];
							var	collision = this.isCollide(a, b);
							if (collision && (!b.holding || b.holdingId != i || b.holdingType != 'item')){
								b.hitByBowlingball(i);
							}
						}
					}
				}
			}
		}
	},
	
	itemPostUpdate: function() {
		for (var i in this.items) {
			if (this.items[i]) {
				this.items[i].postUpdate();
			}
		}
	},
	
	//
	// TRASHCAN
	//
	trashcanUpdate: function() {
		for(var i in this.level.trashcans)
		{
			this.level.trashcans[i].update();
		}
	},
	
	trashcanPostUpdate: function() {
		for (var i in this.level.trashcans) {
			this.level.trashcans[i].postUpdate();
		}
	},
	
	newPacketId: function() {
		this.packetId++;
		return this.packetId;
	},
	
	//
	// SEND DATA FUNCTIONS
	//
	setEmitCallback: function(callbackFunction) {
		this.emitCallback = callbackFunction;
	},
	setShutdownCallback: function(callbackFunction) {
		this.shutdownCallback = callbackFunction;
	},
	sendlobbydata: function(socket) {
		if (this.gameStarting) {
			var gS = this.secondsLeft;
		}
		var sendPlayers = [];
		for (var i in this.players) {
			sendPlayers.push(this.players[i].getLobbyObject());
		}
		this.emitCallback({state: "lobby", maxPlayers: this.maxPlayers, players: sendPlayers, gameStarts:gS, gameStarting:this.gameStarting, packetId: this.newPacketId()}, socket);
	},
	sendplayerselectiondata: function(socket) {
		if(this.gameStarting) {
			var gS = this.secondsLeft;
		}
		var getready = null;
		if (this.playerselection.everybodyChose()) {
			getready = true;
		}
		this.emitCallback({state: "playerselection", selectableplayers: this.playerselection.getData(), gameStarts:gS, gameStarting: this.gameStarting, getready: getready, packetId: this.newPacketId()}, socket);
	},
	sendgamedata: function(socket) {
		if (this.gameStarting) {
			var gS = this.secondsLeft;
		}
		var sendPlayers = [];
		for (var i in this.players) {
			if (this.players[i]) {
				sendPlayers.push(this.players[i].getGameObject());
			}
		}
		var sendEnemies = [];
		for (var i in this.enemies) {
			if (this.enemies[i]) {
				sendEnemies.push(this.enemies[i].getGameObject());
			}
		}
		var sendItems = [];
		for (var i in this.items) {
			if (this.items[i]) {
				sendItems.push(this.items[i].getGameObject());
			}
		}
		var levelSender = this.level.getGameObject();
		
		var showingGoal = null;
		if(this.showingGoal)
		{
			showingGoal = {itemSettings: this.itemSettings, coins: this.maxCoins};
		}
		
		this.emitCallback({state: "game", time: Math.round(new Date().getTime()), players: sendPlayers, enemies: sendEnemies, items: sendItems, floorHitpoints: this.floorHitpoints, gameStarts: gS, gameStarting: this.gameStarting, level: levelSender, showingGoal: showingGoal, sounds: this.sounds, packetId: this.newPacketId()}, socket);
	},
	sendscoredata: function(socket) {
		if (this.gameStarting) {
			var gS = this.secondsLeft;
		}
		var getready = false;
		if (this.gameStarts < new Date().getTime()) {
			getready = true;
		}
		this.emitCallback({state: "score", players: this.scorePlayers, gameStarts: gS, gameStarting: this.gameStarting, won: this.won, scoreState: this.scoreState, getready: getready, maxScore: this.maxScore, round: this.round, gameEnd: this.gameEndReason, packetId: this.newPacketId()}, socket);
	},
	sendCurrentState: function(socket) {
		if (gameEngine.state == 'lobby') {
			gameEngine.sendlobbydata(socket);
		} else if (gameEngine.state == 'playerselection') {
			gameEngine.sendplayerselectiondata(socket);
		} else if (gameEngine.state == 'game') {
			gameEngine.sendgamedata(socket);
		} else if (gameEngine.state == 'score') {
			gameEngine.sendscoredata(socket);
		}
	},
	
	//
	// UTIL FUNCTIONS
	//
	isCollide: function(a, b) {
		if (a.enemyHeight && a.enemyWidth) {
			var aHeight = a.enemyHeight;
			var aWidth = a.enemyWidth;
		} else if (a.playerHeight && a.playerWidth) {
			var aHeight = a.playerHeight;
			var aWidth = a.playerWidth;
		} else if (a.itemHeight && a.itemWidth) {
			var aHeight = a.itemHeight;
			var aWidth = a.itemWidth;
		}
		
		if (b.enemyHeight && b.enemyWidth) {
			var bHeight = b.enemyHeight;
			var bWidth = b.enemyWidth;
		} else if (b.playerHeight && b.playerWidth) {
			var bHeight = b.playerHeight;
			var bWidth = b.playerWidth;
		} else if (b.itemHeight && b.itemWidth) {
			var bHeight = b.itemHeight;
			var bWidth = b.itemWidth;
		}
		
		
		return ((a.x - 50 + aWidth >= b.x) && (a.x <= b.x + bWidth - 50) && (a.y + aHeight >= b.y) && (a.y <= b.y + bHeight));
	}
}

gameEngine.playerselection.setUpdateFunction(gameEngine.sendCurrentState);

module.exports = gameEngine;

// This export should be at the bottom of the page!
var level = require('./level.js');
var playerSelection = require('./playerselection.js');