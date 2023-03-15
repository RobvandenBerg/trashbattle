var game = 
(function () {
		var io = window.io;
		var socket;
		var connection;
		var displayFunction;
	
		var game = {
			version: 1.0,
			author: "Rob van den Berg, Mitchell Olsthoorn",
			updated: "",
			maxPlayers: 4,
			enemies: [],
			players: [],
			items: [],
			trashcans: [],
			packets: [],
			floorHitpoints: [],
			state: "loading",
			gameStarting: false,
			gameStarts: 0,
			guests: 0,
			chat: 0,
			packetId: 0,
			maxScore: 5,
			maxCoins: 10,
			lives: 3,
			maxWins: 5,
			itemSettings: {coin: 1, bowlingball: 1, star: 1, heart: 1, tnt: 1},
			difficulty: 'medium',
			passwordLength: 0,
			scoreState: null,
			round: 0,
			host: null,
			getready: null,
			timedifference: serverTimeDifference,
			oldmethodtimediffernce: serverTimeDifference,
			timedifferences: [],
			selectablePlayers: [],
			level: null,
			sounds: [],
			trashcans: [],
			lastState: null,
			checkNum: 0,
			won: null,
			gameEnd: null,
			animations: [],
			showingGoal: null,
			testDividedBy: 0,
			getStarting: function()
			{
				if(this.gameStarting)
				{
					return this.gameStarts;
				}
				return false;
			},
			getPlayer: function(playerid)
			{
				return this.players[playerid-1];
			},
			getPlayerByName: function(username)
			{
				for(var i in this.players)
				{
					if(this.players[i] && this.players[i].username == username)
					{
						return this.players[i];
					}
				}
				return null;
			},
			getMaxPlayers: function()
			{
				return this.maxPlayers;
			},
			getSelectablePlayers: function()
			{
				return this.selectablePlayers;
			},
			getPlayers: function()
			{
				return this.players;
			},
			getAmountOfPlayers: function()
			{
				return this.players.length;
			},
			isParticipant: function(username)
			{
				for(var i in this.players)
				{
					if(this.players[i].username == username)
					{
						return true;
					}
				}
				return false;
			},
			getTimeDifference: function()
			{
				return this.timedifference;
			},
			calculateServerTime: function(time)
			{
				if(!time)
				{
					time = new Date().getTime();
				}
				return time + this.getTimeDifference(time);
			},
			connect: function (url, df) {
				if (connection != null) {
					this.disconnect();
				}
				
				displayFunction = df;
				
				var ip = url + '/game';
				socket = io.connect(ip);
				
				if (socket != null) {
					connection = ip;
					var password = '';
					if(p)
					{
						password = window.prompt('This game is protected with a password. Please enter the password:');
					}
					game.verify(uname,userid,password);
				}
				
				socket.on('gamedata', function (data) {
					// Handle game data
					// console.log(data);
					if(data.packetId)
					{
						if(data.packetId < game.packetId)
						{
							console.log('Old package with id ' + data.packetId + ' discarded!');
							return; // Don't deliver old packages
						}
						game.packetId = data.packetId;
					}
					game.state = data.state;
					paket = data;
					if(game.state == "lobby")
					{
						game.maxPlayers = data.maxPlayers;
						game.players = data.players;
						game.gameStarts = data.gameStarts;
						game.gameStarting = data.gameStarting;
					}
					if(game.state == "score")
					{
						if(game.lastState != 'score')
						{
							console.log('score packet:');
							console.log(data);
							game.animations = [];
						}
						game.players = data.players;
						game.gameStarts = data.gameStarts;
						game.gameStarting = data.gameStarting;
						game.won = data.won;
						game.getready = data.getready;
						game.maxScore = data.maxScore;
						game.round = data.round;
						game.scoreState = data.scoreState;
						game.gameEnd = data.gameEnd;
					}
					if(game.state == "playerselection")
					{
						game.gameStarts = data.gameStarts;
						game.gameStarting = data.gameStarting;
						game.selectablePlayers = data.selectableplayers;
						game.getready = data.getready;
					}
					if(game.state == "game")
					{
						if(game.lastState != 'game')
						{
							game.players = [];
							game.packets = [];
							game.enemies = [];
							game.floors = [];
							game.trashcans = [];
							game.sounds = [];
							game.floorHitpoints = [];
							game.checkNum = 100;
						}
						// The real shit happens here
						game.checkNum++;
						if(game.checkNum % 10 == 0)
						{
							game.timedifferences[game.checkNum] = data.time - new Date().getTime();
						}
						if(game.checkNum > 100)
						{
							game.checkNum = 0;
							var totalDiff = 0;
							var devidedBy = 0;
							
							
							game.timedifferences.sort();
							console.log('The median is ' + game.timedifferences[4]);
							game.timedifference = game.timedifferences[4];
							
						
							for(var i in game.timedifferences)
							{
								totalDiff += game.timedifferences[i];
								devidedBy++;
							}
							var tempTimeDifference = totalDiff / devidedBy;
							console.log('synced time based on ' + devidedBy + ' values. Result: ' + totalDiff);
							
							var totalDiff = 0;
							var devidedBy = 0;
							for(var i in game.timedifferences)
							{
								if(Math.abs(game.timedifferences[i] - tempTimeDifference) < 50)
								{
									totalDiff += game.timedifferences[i];
									devidedBy++;
								}
							}
							game.oldmethodtimedifference = totalDiff / devidedBy;
							game.testDividedBy = devidedBy;
							console.log('After throwing out irrealistic values, synced time based on ' + devidedBy + ' values. Result: ' + totalDiff);
							game.oldmethodtimedifference = game.timedifference;
							game.timedifferences = [];
						}
						game.packets.push({time: data.time, players: data.players, enemies: data.enemies, trashcans: data.level.trashcans, items: data.items, floorHitpoints: data.floorHitpoints, sounds: data.sounds});
						game.level = level.getLevel(data.level.levelId);
						game.trashcans = data.level.trashcans;
						if(game.packets.length > 5)
						{
							// Splice off the oldest packet
							game.packets.splice(0,1);
						}
						game.showingGoal = data.showingGoal;
						game.players = data.players;
						game.enemies = data.enemies;
						game.items = data.items;
					}
					game.lastState = game.state;
				});
				
				socket.on('settings', function (data) {
					// Handle game settings
					console.log(data);
					game.guests = data.guests;
					game.maxPlayers = data.maxPlayers;
					game.chat = data.chat;
					game.maxCoins = data.maxCoins;
					game.lives = data.lives;
					game.maxWins = data.maxWins;
					game.itemSettings = data.itemSettings;
					game.difficulty = data.difficulty;
					game.passwordLength = data.passwordLength;
					game.host = data.host;
					game.timedifference = data.servertime - new Date().getTime();
					game.updateSettings();
				});
				
				socket.on('shutdown', function (shutdownmessage) {
					game.shutdown(shutdownmessage);
				});
				
				socket.on('kick', function (kickmessage) {
					if(debugmode)
					{
						console.log('KICK: '+kickmessage);
						return;
					}
					window.location = './index.html?msg='+encodeURI(kickmessage);
				});
				
				socket.on('disconnect', game.connectionError);
				
				socket.on('connect_error', game.connectionError);
				
			},
			verify: function(uname,userid,password) {
				if(!game.isConnected()){ return; }
				socket.emit('verify', {username: uname, id: userid, sessid: sessid, password: password});
				console.log('We sent a verify request');
			},
			join: function() {
				if(!game.isConnected()){ return; }
				socket.emit('join', null);
				console.log('We sent a join request');
			},
			leave: function() {
				if(!game.isConnected()){ return; }
				socket.emit('leave', null);
				console.log('We sent a leave request');
			},
			start: function() {
				if(!game.isConnected()){ return; }
				socket.emit('game', 'start');
				console.log('We sent a start request');
			},
			hoverCharacter: function(x,y) {
				if(!game.isConnected()){ return; }
				socket.emit('hoverCharacter', {x: x, y: y});
				console.log('We sent a hover Character request');
			},
			selectCharacter: function(x,y) {
				if(!game.isConnected()){ return; }
				socket.emit('selectCharacter', {x: x, y: y});
				console.log('We sent a select Character request');
			},
			unselectCharacter: function() {
				if(!game.isConnected()){ return; }
				socket.emit('unselectCharacter', null);
				console.log('We sent an unselect Character request');
			},
			changeSettings: function()
			{
				if(!game.isConnected()){ return; }
				if(this.host != uname)
				{
					return;
				}
				console.log('Update settings request');
				var chat = getSelectValue('CGChat');
				var maxPlayers = getSelectValue('CGMaxPlayers');
				var guests = getSelectValue('CGGuests');
				var maxCoins = getSelectValue('CGMaxCoins');
				var lives = getSelectValue('CGLives');
				var maxWins = getSelectValue('CGMaxWins');
				var itemSettings = CGItems;
				var difficulty = getSelectValue('CGDifficulty');
				var password = '';
				var setP = document.getElementById('CGPassword').value;
				if(getSelectValue('CGPasswordProtected') == 1 && setP.replaceAll('*', '') != '')
				{
					password = document.getElementById('CGPassword').value;
				}
				
				var settingsObject = {chat: chat, maxPlayers: maxPlayers, guests: guests, maxCoins: maxCoins, lives: lives, maxWins: maxWins, itemSettings: itemSettings, difficulty: difficulty, password: password}
				socket.emit('settings', settingsObject);
				
			},
			claimHost: function(username) {
				if(!game.isConnected()){ return; }
				var claimName = uname;
				if(username)
				{
					claimName = username;
				}
				socket.emit('claimHost', claimName);
				console.log('We sent an claim host request for '+claimName);
			},
			connectionError: function() {
				if(debugmode)
				{
					console.log('ERROR: '+ 'The server for this game got shut down. You are now being redirected to the menu');
					alert('DAT ERROR OCCURED');
					return;
				}
				window.location = './index.html?msg='+encodeURI('Connection to the game server was lost. You are now being redirected to the menu.');
			},
			disconnect: function () {
				if (connection != null) {
					socket.disconnect();
					delete io.sockets[connection];
					connection = null;
					io.j = [];
				}
			},
			isConnected: function () {
				if (socket == null) {
					return false;
				}
				return true;
			},
			keyDownSend: function (keyAction) {
				if(!game.isConnected()){ return; }
				socket.emit('inputDown', keyAction);
			},
			keyUpSend: function (keyAction) {
				if(!game.isConnected()){ return; }
				socket.emit('inputUp', keyAction);
			},
			shutdown: function (shutdownmessage){
				if(debugmode)
				{
					console.log('SHUTDOWN: '+kickmessage);
					return;
				}
				window.location = './index.html?msg='+encodeURI(shutdownmessage);
			},
			updateSettings: function() {
				if(this.chat)
				{
					document.getElementById('switchToChat').style.display = 'table-cell';
				}
				else
				{
					document.getElementById('switchToChat').style.display = 'none';
					switchToPeople();
				}
				document.getElementById('CGHost').innerHTML = this.host;
				if(m && this.host != uname)
				{
					document.getElementById('CGHost').innerHTML += ' <input type="button" value="Become host" onclick="game.claimHost();">';
				}
				if(this.host == uname)
				{
					document.getElementById('CGHost').innerHTML += ' <input type="button" value="Assign new host" onclick="game.claimHost(window.prompt(\'Who should the next game host be?\'));">';
				}
				
				// Regularly update the settings screen
				setSelectValue('CGChat',this.chat);
				setSelectValue('CGMaxPlayers',this.maxPlayers);
				setSelectValue('CGGuests',this.guests);
				setSelectValue('CGMaxCoins',this.maxCoins);
				setSelectValue('CGLives',this.lives);
				setSelectValue('CGMaxWins',this.maxWins);
				setSelectValue('CGDifficulty',this.difficulty);
				
				itemtoggle('coin',true,this.itemSettings['coin']);
				itemtoggle('bowlingball',true,this.itemSettings['bowlingball']);
				itemtoggle('star',true,this.itemSettings['star']);
				itemtoggle('heart',true,this.itemSettings['heart']);
				itemtoggle('tnt',true,this.itemSettings['tnt']);
				
				if(this.host == uname)
				{
					// I am the host!
					document.getElementById('CGChat').disabled = false;
					document.getElementById('CGMaxPlayers').disabled = false;
					document.getElementById('CGGuests').disabled = false;
					document.getElementById('CGMaxCoins').disabled = false;
					document.getElementById('CGLives').disabled = false;
					document.getElementById('CGMaxWins').disabled = false;
					document.getElementById('CGDifficulty').disabled = false;
					document.getElementById('CGPasswordProtected').disabled = false;
					document.getElementById('CGPassword').disabled = false;
					
					var elements = document.getElementsByClassName('itemcontainer');
					for(var i in elements)
					{
						if(elements[i].id)
						{
							elements[i].style.cursor = 'pointer';
						}
					}
				}
				else
				{
					// Update the password
					var password = '';
					for(var i = 0; i < this.passwordLength; i++)
					{
						password += '*';
					}
					if(password.length > 0)
					{
						passwordtoggle(true,1);
					}
					else
					{
						passwordtoggle(true,0);
					}
					document.getElementById('CGPassword').value = password;
					
					// Update the other settings
					document.getElementById('CGMaxPlayers').disabled = true;
					document.getElementById('CGChat').disabled = true;
					document.getElementById('CGGuests').disabled = true;
					document.getElementById('CGMaxCoins').disabled = true;
					document.getElementById('CGLives').disabled = true;
					document.getElementById('CGMaxWins').disabled = true;
					document.getElementById('CGDifficulty').disabled = true;
					document.getElementById('CGPasswordProtected').disabled = true;
					document.getElementById('CGPassword').disabled = true;
					
					
					var elements = document.getElementsByClassName('itemcontainer');
					for(var i in elements)
					{
						if(elements[i].id)
						{
							elements[i].style.cursor = 'auto';
						}
					}
				}
			},
		};
     
		return game;
}());