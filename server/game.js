var moduleDir = "./modules/";
var emoticonManager = require(moduleDir + 'emoticons.js');
var gameEngine = require(moduleDir + 'game-engine.js');
var htmlentities = require(moduleDir + 'htmlentities.js');
var iconsManager = require(moduleDir + 'icons.js');
var mysql_query = require(moduleDir + 'mysql.js');
var sessionManager = require(moduleDir + 'memcached.js');
var user = require(moduleDir + 'user.js');
var player = require(moduleDir + 'player.js');
var enemy = require(moduleDir + 'enemy.js');
var item = require(moduleDir + 'item.js');
var trashcan = require(moduleDir + 'trashcan.js');
var updateSettings = require(moduleDir + 'settings.js');
var timeConversion = require(moduleDir + 'time-conversion.js');
var mysql_real_escape_string = require(moduleDir + 'mysql-real-escape-string.js');
var olai = require(moduleDir + 'olai/olai.js');
var fs = require('fs');
var cheats = false;


var BETA = true;
var ALLOW_GUESTS = true;

var standardport = 2000;
var port = parseInt(process.argv[2]);

if (isNaN(port)) {
	port = standardport;
}

sessionManager.connect('localhost:11211');
iconsManager.setGameEngine(gameEngine);

var io = require('socket.io', {rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']}).listen(port);


var runningSince = new Date().getTime();
var chat = 0;

var serverMessageObject = {"username": "Server", "usernameColor": "purple", "id": 0};

var mysqlid;
var resultFunction = function (rows) {
	for (var i in rows) { 
		console.log(rows[i]);
		mysqlid = rows[i]['id'];
		var host = rows[i]['username'];
		gameEngine.setHost(host);
		var guests = Math.round(rows[i]['guests']);
		gameEngine.setGuests(guests);
		var maxPlayers = Math.round(rows[i]['max_players']);
		gameEngine.setMaxPlayers(maxPlayers);
		chat = Math.round(rows[i]['chat']);
		gameEngine.nextMaxCoins = Math.round(rows[i]['maxCoins']);
		gameEngine.nextLives = Math.round(rows[i]['lives']);
		gameEngine.nextMaxScore = Math.round(rows[i]['maxWins']);
		gameEngine.nextItemSettings = JSON.parse(rows[i]['items']);
		gameEngine.nextDifficulty = rows[i]['difficulty'];
		password = rows[i]['password'];
		broadcastSettings();
	}
	gameEngine.setMySQLId(mysqlid);
	console.log('MySQL id of this game: '+mysqlid);
}

mysql_query(
	'SELECT games.id,users.username,games.guests,games.max_players,games.chat,games.maxCoins,games.lives,games.maxWins,games.items,games.difficulty,games.password from trashbattle.games, trashbattle.users where port=' + port + ' and users.id=games.host order by ID DESC LIMIT 0,1',
	function(){startshutdown(1, "MySQL error")},
	true,
	resultFunction
);

console.log('game.js is listening on *:' + port);

var people = [];
var messages = [];
var maxMessages = 50;

var password = '';

var gameSockets = [];

function getSocketId(raw)
{
	var s = raw.split('#');
	return s[1];
}

var nspChat = io.of('/chat');
nspChat.on('connection', function(socket) {
	var address = socket.handshake.address;
	console.log('New chat connection from ' + address.address + ':' + address.port);
	console.log('Socket id: ' + socket.id);
	
	var socketid = getSocketId(socket.id);
	
	gameSockets[socketid] = socket;
	
	if (!people[socketid]) {
		people[socketid] = new user(socketid);
	}
	
	
	
	people[socketid].chatsocket = socket;
	
	console.log('Set socket of ' + people[socketid].username);
	
	socket.on('message', function(msg) {
		if (msg.length < 201) {
			if (people[socketid]) {
				if (people[socketid].hasVerified() && !people[socketid].isGuest()) {
					var commands = "<table>";
					
					if (people[socketid].isGod()) {
						if(msg == '/server' ||msg == '/help') {
							commands += "<tr><td><span style='color: red;'>/cheats on/off</span></td><td>Turn cheats on or off</td></tr>";
							commands += "<tr><td><span style='color: red;'>/hit &lt;username&gt;</span></td><td>Hit the user with the username &lt;username&gt;</td></tr>";
							commands += "<tr><td><span style='color: red;'>/star &lt;username&gt;, &lt;ticks&gt;</span></td><td>Make a user starred for a number of ticks</td></tr>";
							commands += "<tr><td><span style='color: red;'>/wtf [message]</span></td><td>WTF BOOOOOOMMM!!</td></tr>";
							commands += "<tr><td><span style='color: red;'>/error</span></td><td>Cause an error on the server (ROFL)</td></tr>";
						}
						
						var wtfsplit = msg.split('/wtf');
						if (wtfsplit.length == 2 && wtfsplit[0] == '') {
							var sendmsg = '<br><img alt="WHAT THE FU-BOOM!" width="50%" src="./images/wtfboom.png">';
							msg = htmlentities(wtfsplit[1]);
							msg = emoticonManager.parseString(msg) + sendmsg;
							var user = iconsManager.parseUser(people[socketid]);
							broadcastMessage(user, msg, {wtf: true});
							return;
						}

						// TODO This is a messy way to initialise an AI instance, should do something about it
                        if (msg == '/olai-init') {
                            var olaiInstance = new olai.instance();
                            broadcastMessage(iconsManager.parseUser(olaiInstance.getOlaiUser()), 'OlAI Instance Initialised by ' + people[socketid].getUsername());
                            console.log("Created olai instance");
							return;
                        }
						
						if(msg == '/error')
						{
							nonExistingErrorThatMakesTheServerCrashXD();
							return;
						}
						
						
						var hitsplit = msg.split('/hit ');
						if(hitsplit.length == 2 && hitsplit[0] == '')
						{
							if(!cheats)
							{
								return;
							}
							var hitUsername = hitsplit[1].toLowerCase();
							var dohit = true;
							for (var i in people)
							{
								if (people[i].getUsername().toLowerCase() == hitUsername && people[i].getGameSocket())
								{
									if(people[i].isGod())
									{
										// You can't do that to a god
										dohit = false;
									}
								}
							}
							if(dohit)
							{
								for (var i in gameEngine.players) {
									if (gameEngine.players[i] && gameEngine.players[i].username.toLowerCase() == hitUsername) {
										gameEngine.players[i].hitByEnemy();
									}
								}
							}
							return;
						}
						
						var starsplit = msg.split('/star ');
						if(starsplit.length == 2 && starsplit[0] == '')
						{
							if(!cheats)
							{
								return;
							}
							var starUsername = starsplit[1].toLowerCase();
							var amountOfTicks = 160;
							var unamesplit = starUsername.split(', ');
							if(unamesplit.length == 2)
							{
								starUsername = unamesplit[0];
								amountOfTicks = unamesplit[1];
							}
							for (var i in gameEngine.players) {
								if (gameEngine.players[i] && gameEngine.players[i].username.toLowerCase() == starUsername) {
									gameEngine.players[i].setStarred(amountOfTicks);
								}
							}
							return;
						}
						
						var cheatssplit = msg.split('/cheats ');
						if(cheatssplit.length == 2 && cheatssplit[0] == '')
						{
							var newvalue = cheatssplit[1];
							if(newvalue == 'on')
							{
								cheats = true;
								broadcastServerMessage(people[socketid].getUsername() + ' activated cheats');
							}
							else if(newvalue == 'off')
							{
								cheats = false;
								broadcastServerMessage(people[socketid].getUsername() + ' deactivated cheats');
							}
							return;
						}
					}
					
					
					if (people[socketid].isModerator()) {

						if(msg == '/server' || msg == '/help') {
							commands += "<tr><td><span style='color: red;'>/close</span></td><td>Close the game</td></tr>";
							commands += "<tr><td><span style='color: red;'>/kick &lt;username&gt; [, reason]</span></td><td>Kick a user that is not a god</td></tr>";
							commands += "<tr><td><span style='color: red;'>/ban &lt;username&gt;, &lt;Minutes&gt; [, reason]</span></td><td>Ban a user that is not a god</td></tr>";
							commands += "<tr><td><span style='color: red;'>/unban &lt;username&gt;</span></td><td>unBan a user</td></tr>";
						}
						if (msg == '/close') {
							startshutdown(0,"Somebody closed the server");
							return;
						}
						
						if (msg.split('/kick ').length == 2) {
							var msgsplit = msg.split('/kick ');
							if (msgsplit[0] == '') {
								var kickUsername = msgsplit[1];
								var kickMessage = 'You got kicked by ' + people[socketid].getUsername();
								var split2 = msgsplit[1].split(', ');
								
								if (split2.length == 2) {
									kickUsername = split2[0];
									kickMessage = 'You got kicked by ' + people[socketid].getUsername() + ': "' + htmlentities(split2[1]) + '"';
								}
								kickUsername = kickUsername.toLowerCase();
								for (var i in people) {
									if (people[i].getUsername().toLowerCase() == kickUsername && people[i].getGameSocket()) {
										if(people[i].isGod()) {
											// You can't kick a god
											kickMessage = 'YOU CAN\'T KICK THE ALMIGHTY ' + people[i].getUsername().toUpperCase() + ', FOOL';
											if (!people[socketid].isGod()) {
												kick(people[socketid], kickMessage);
												broadcastServerMessage(people[socketid].getUsername() + ' tried and failed miserably to kick ' + people[i].getUsername() + ' and got him/herself kicked instead!');
											}
											return;
										}
										kick(people[i], kickMessage);
										return;
									}
								}
							}
						}
						
						if (msg.split('/ban ').length == 2) {
							var msgsplit = msg.split('/ban ');
							if (msgsplit[0] == '') {
								var split = msgsplit[1].split(', ');
								if ((split.length == 2 || split.length == 3) && split[0] != '') {
									var banUsername = split[0];
									var time = Math.round(new Date().getTime() / 1000);
									var banTime = (split[1] * 60) + time;
									var banMessage = 'You got banned by ' + people[socketid].getUsername() + ' for ' + split[1] + ' minutes';
									
									if (split.length == 3) {
										banMessage = 'You got banned by ' + people[socketid].getUsername() + ' for ' + split[1] + ' minutes : "' + htmlentities(split[2]) + '"';
									}
									
									banUsername = banUsername.toLowerCase();
									for (var i in people) {
										if (people[i].getUsername().toLowerCase() == banUsername && people[i].getGameSocket()) {
											if (people[i].isGod()) {
												// You can't ban a god
												banMessage = 'YOU CAN\'T BAN THE ALMIGHTY ' + people[i].getUsername().toUpperCase() + ', FOOL';
												if (!people[socketid].isGod()) {
													ban(people[socketid], banTime, banMessage);
													broadcastServerMessage(people[socketid].getUsername() + ' tried and failed miserably to ban ' + people[i].getUsername() + ' and got him/herself banned instead!');
												}
												return;
											}
											ban(people[i], banTime, banMessage);
											return;
										}
									}
								}
							}
						}
						
						if (msg.split('/unban ').length == 2) {
							var msgsplit = msg.split('/ban ');
							if (msgsplit[0] == '') {
								var banUsername = msgsplit[1];
								mysql_query('Delete from trashbattle.bans where username="' + banUsername + '"');
							}
							return;
						}
					}
					
					if (msg.split('/report ').length == 2) {
						var msgsplit = msg.split('/report ');
						if (msgsplit[0] == '') {
							var split2 = msgsplit[1].split(', ');
							
							if (split2.length == 2) {
								var reportUsername = split2[0];
								var reportReason = split2[1];
								reportUsername = reportUsername.toLowerCase();
								for (var i in people) {
									if (people[i].getUsername().toLowerCase() == reportUsername && people[i].getGameSocket()) {
										if(people[i].isGod()) {
											// You can't report a god
											var kickMessage = 'YOU CAN\'T REPORT THE ALMIGHTY ' + people[i].getUsername().toUpperCase() + ', FOOL';
											if (!people[socketid].isGod()) {
												kick(people[socketid], kickMessage);
												broadcastServerMessage(people[socketid].getUsername() + ' tried and failed miserably to report ' + people[i].getUsername() + ' and got him/herself kicked instead!');
											}
											return;
										}
										var seconds = new Date().getTime();
										fs.writeFile('reports/report-' + seconds + '.txt', messages.map(function(elem) {return elem.sender.username + ' (' + elem.sender.userid + '): ' + elem.message;}).join("\n"), function (err) {
											if (err) {
												console.log('Error writing report file to disk');
											}
											mysql_query('Insert into trashbattle.reports (reporter,reportee,reason,datetime) VALUES ("' + people[socketid].getUsername() + '","' + reportUsername + '","' + reportReason + '",' + seconds + ')');
										});
										return;
									}
								}
							}
						}
					}
					
					if (msg.split('/color ').length == 2) {
						var msgsplit = msg.split('/color ');
							
						if (msgsplit[0] == '' && msgsplit[1] != '') {
							changeUsernameColor(msgsplit[1]);
						}
						return;
					}
					
					if (msg == '/server' || msg == '/help') {
						commands += "<tr><td><span style='color: red;'>/report &lt;username&gt;, &lt;reason&gt;</span></td><td>Report a user for inappropriate behaviour</td></tr>";
						commands += "<tr><td><span style='color: red;'>/color &lt;color&gt;</span></td><td>Change the color of your username</td></tr>";
						commands += "<tr><td><span style='color: red;'>/server</span></td><td>Commands</td></tr>";
						commands += "<tr><td><span style='color: red;'>/help</span></td><td>Commands</td></tr>";
						commands += "</table>";
						var message = {"sender": serverMessageObject, "message": commands};
						socket.emit('message', message);
						return;
					}
				
					msg = msg.trim();
					if (msg != '' && chat) {
						msg = htmlentities(msg);
						msg = emoticonManager.parseString(msg);
						var user = iconsManager.parseUser(people[socketid]);
						broadcastMessage(user, msg);
					}
				}
			}
			else {
				socket.emit("hacker", "Don't change our js code");
			}
		}
		return;
	});
	
	socket.on('usernameColor', function(newColor) {
		if (people[socketid]) {
			if (people[socketid].hasVerified()) {
				changeUsernameColor(newColor);
			}
		} else {
			socket.emit("hacker", "Don't change our js code");
		}
	});
	
	socket.on('disconnect', function() {
		//console.log('user chat connection from ' + address.address + ':' + address.port + ' disconnected');
		broadcastPeople();
	});
	
	function changeUsernameColor(color) {
		if (color.length < 8) {
			var newColor = htmlentities(color);
			people[socketid].setUsernameColor(newColor);
			broadcastServerMessage(people[socketid].getUsername() + '\'s username color is now <span style="color: '+ newColor +'">'+ newColor +'</span>');
			mysql_query('Update trashbattle.users set usernameColor="' + newColor + '" where username="' + people[socketid].getUsername() + '"');
		}
	};
	
	function kick(user, message) {
		user.getGameSocket().emit('kick',message);
	};
	
	function ban(user, banTime, message) {
		kick(user, message);
		mysql_query('REPLACE into trashbattle.bans (username, ip, time) values("' + user.getUsername() + '", "' + user.getIp() + '", "' + banTime + '")');
	};
});

var nspGame = io.of('/game');
nspGame.on('connection', function (socket) {
	var address = socket.handshake.address;
	console.log('New game connection from ' + address.address + ':' + address.port);
	console.log('Socket id: ' + socket.id);
	
	var socketid = getSocketId(socket.id);
	
	if (!people[socketid]) {
		people[socketid] = new user(socketid);
	}
	
	socket.on('verify', function (data) {
		var sessid = data['sessid'];
		console.log('Session id: ' + sessid);
		
		var kick = function (msg) {
			socket.emit('kick', msg);
			console.log(people[socketid].getUsername() + ' kicked: ' + msg + ' (SL debug msg)');
			mysql_query('Delete from trashbattle.sessions where username="' + people[socketid].getUsername() + '"');
		}
		
		if (password && data.password != password) {
			kick('Incorrect Password');
			return;
		}
		
		var sessionRetrieved = function(session)
		{
			var sessionUsername = session['username'];
			if(!sessionUsername)
			{
				kick('We were not able to verify you!');
			}
			var ip = session['ip'];
			console.log('Ip:' + ip);
			
			var resultSessionFunction = function (rows) {
				for (var i in people) {
					if(people[i].getUsername() == sessionUsername) {
						kick('You are already in this game, you cannot join twice!');
						return;
					}
				}
				for (var i in rows) { 
					if (rows[i].total > 0) {
						kick('You are already in another game, you cannot join twice!');
						return;
					}
				}
				mysql_query(
					'SELECT COUNT( * ) AS total, time FROM trashbattle.bans WHERE  username="' + sessionUsername + '" OR ip="' + ip + '"',
					function(){startshutdown(1, "MySQL error")},
					true,
					resultBanFunction
				);
			}
			
			var resultBanFunction = function (rows) {
				for (var i in rows) { 
					var row = rows[i];
					if (row.total > 0) {
						var time = Math.round(new Date().getTime() / 1000);
						var banTime = row.time - time;
						
						var res = timeConversion(banTime);
						
						if (banTime > 0) {
							kick('You\'re banned for ' + res.quantity + ' more ' + res.unit);
							return;
						} else {
							mysql_query('Delete from trashbattle.bans where username="' + sessionUsername + '"');
						}
					}
				}
				noKick(session);
			}
			
			mysql_query(
				'SELECT count(*) as total from trashbattle.sessions, trashbattle.games where sessions.username="' + sessionUsername + '" and games.id=sessions.game',
				function(){startshutdown(1, "MySQL error")},
				true,
				resultSessionFunction
			);
		}
		
		var noKick = function (session) {
			var moderator = Math.round(session['moderator']);
			var sessionUsername = session['username'];
			var loggedin = session['loggedin'];
			var userid = parseInt(session['userid']);
			var god = parseInt(session['god']);
			var coins = parseInt(session['coins']);
			var ranking = parseInt(session['ranking']);
			var usernameColor = session['usernameColor'];
			var ip = session['ip'];
			
			console.log(sessionUsername + '\'s god status: '+god);
		
			mysql_query('Insert into trashbattle.sessions (username,game) VALUES ("' + sessionUsername + '",'+mysqlid+')');
			
			console.log('Session ' + sessid + ' username: ' + sessionUsername);
			people[socketid].verifyUser(loggedin, userid, sessionUsername, usernameColor, moderator, god, coins, ranking, socket, ip);
			console.log('Some user connected with username ' + sessionUsername + ', userid ' + userid);
			
			// Send the user the game data
			gameEngine.sendCurrentState(socket);
			
			// Send a message that somebody new connected
			broadcastServerMessage(people[socketid].getUsername() + ' connected!');
			broadcastSettings(socket);
			broadcastPeople();
			if(people[socketid].getChatSocket())
			{
				people[socketid].getChatSocket().emit('message-log', messages);
			}
		}
		
		sessionManager.getSession(sessid, sessionRetrieved);
	});
  
	socket.on('game', function (data) {
		if (people[socketid] && people[socketid].hasVerified() && data == 'start') {
			console.log(people[socketid].getUsername() + ' tries to start the game');
			gameEngine.startCountdown(socketid);
		}
	});
	
	socket.on('join', function() {
		if (people[socketid] && people[socketid].hasVerified()) {
			gameEngine.join(people[socketid].getPlayerObject());
			console.log('Got a join request');
		}
	});
	
	socket.on('leave', function() {
		if (people[socketid] && people[socketid].hasVerified()) {
			gameEngine.leave(socketid);
		}
	});
	
	socket.on('hoverCharacter', function(data) {
		if (people[socketid] && people[socketid].hasVerified()) {
			gameEngine.hoverCharacter(socketid, data.x,data.y);
			console.log('Got a hover character request');
		}
	});
	
	socket.on('selectCharacter', function(data) {
		if (people[socketid] && people[socketid].hasVerified()) {
			gameEngine.selectCharacter(socketid, data.x,data.y);
			console.log('Got a select character request');
		}
	});
	
	socket.on('unselectCharacter', function(data) {
		if (people[socketid] && people[socketid].hasVerified()) {
			gameEngine.unselectCharacter(socketid);
			console.log('Got an unselect character request');
		}
	});
	
	socket.on('claimHost', function(data) {
		console.log('Got a claim host request for ' + data);
		if(people[socketid] && people[socketid].hasVerified() && people[socketid].isModerator() || people[socketid].getUsername() == gameEngine.getHost()) {
			// You have the right to change the host because you're a moderator or you are the host
			for(var i in people) {
				if(people[i].getUsername().toLowerCase() == data.toLowerCase()) {
					if(people[i].isGuest()) {
						// You can't make guests the game host!
						broadcastServerMessage(people[i].getUsername() + ' cannot be the game host because (s)he is a guest!');
						return;
					}
					var hostId = people[i].getUserId();
					gameEngine.setHost(people[i].getUsername());
					mysql_query('UPDATE trashbattle.games set host='+hostId+' where id='+mysqlid,function(){startshutdown('MySQL error');});
					broadcastSettings();
					return;
				}
			}
		}
	});
  
	socket.on('disconnect', function () {
		delete gameSockets[socketid];
		
		// Leave the gameEngine
		gameEngine.leave(socketid,true);
		
		// Send a message that somebody disconnected
		if (people[socketid]) {
			if(people[socketid].hasVerified()) {
				broadcastServerMessage(people[socketid].getUsername() + ' disconnected');
				console.log(people[socketid].getUsername() + ' disconnected');
				mysql_query('Delete from trashbattle.sessions where username="' + people[socketid].getUsername() + '"');
			}
			delete people[socketid];
		}
	});
	
	socket.on('inputDown', function (keyAction) {
		if (people[socketid] && people[socketid].hasVerified()) {
			gameEngine.inputDown(socketid, keyAction);
		}
	});
	
	socket.on('inputUp', function (keyAction) {
		if (people[socketid] && people[socketid].hasVerified()) {
			gameEngine.inputUp(socketid, keyAction);
		}
	});
	
	socket.on('settings', function(data) {
		if(people[socketid] && people[socketid].hasVerified() && gameEngine.getHost() == people[socketid].getUsername()) {
			var enableChat = data.chat;
			var allowGuests = data.guests;
			var maxPlayers = data.maxPlayers;
			var maxCoins = data.maxCoins;
			var lives = data.lives;
			var maxWins = data.maxWins;
			var difficulty = data.difficulty;
			var clientItemSettings = data.itemSettings;
			var enteredPassword = data.password;
			
			if(allowGuests == 1 && !ALLOW_GUESTS)
			{
				allowGuests = 0;
			}
			
			if(enableChat != 0 && enableChat != 1) {
				return;
			}
			if(allowGuests != 0 && allowGuests != 1) {
				return;
			}
			if(maxPlayers != 2 && maxPlayers != 3 && maxPlayers != 4) {
				return;
			}
			if(maxCoins != 5 && maxCoins != 10 && maxCoins != 15) {
				return;
			}
			if(lives != 1 && lives != 2 && lives != 3 && lives != 5) {
				return;
			}
			if(maxWins != 1 && maxWins != 2 && maxWins != 3 && maxWins != 5 && maxWins != 10 && maxWins != 15) {
				return;
			}
			if(difficulty != 'easy' && difficulty != 'medium' && difficulty != 'hard') {
				return;
			}
			if(clientItemSettings['coin'] != 0 && clientItemSettings['coin'] != 1)
			{
				return;
			}
			if(clientItemSettings['bowlingball'] != 0 && clientItemSettings['bowlingball'] != 1)
			{
				return;
			}
			if(clientItemSettings['star'] != 0 && clientItemSettings['star'] != 1)
			{
				return;
			}
			if(clientItemSettings['heart'] != 0 && clientItemSettings['heart'] != 1)
			{
				return;
			}
			if(clientItemSettings['tnt'] != 0 && clientItemSettings['tnt'] != 1)
			{
				return;
			}
			if(enteredPassword.length > 20)
			{
				return;
			}
			
			var itemSettings = {coin: clientItemSettings['coin'], bowlingball: clientItemSettings['bowlingball'], star: clientItemSettings['star'], heart: clientItemSettings['heart'], tnt: clientItemSettings['tnt']};
			
			
			chat = Math.round(enableChat);
			gameEngine.guests = Math.round(allowGuests);
			gameEngine.setMaxPlayers(Math.round(maxPlayers));
			gameEngine.nextMaxCoins = Math.round(maxCoins);
			gameEngine.nextLives = Math.round(lives);
			gameEngine.nextMaxScore = Math.round(maxWins);
			gameEngine.nextDifficulty = difficulty;
			gameEngine.nextItemSettings = itemSettings;
			password = enteredPassword;
			
			// Data is correct, let's update it
			mysql_query('UPDATE trashbattle.games set chat=' + enableChat + ',guests=' + allowGuests + ',max_players=' + maxPlayers + ',maxCoins=' + maxCoins + ',lives=' + lives + ',maxWins=' + maxWins + ',items=\'' + JSON.stringify(itemSettings) + '\', difficulty="' + difficulty + '", password="' + mysql_real_escape_string(password) + '" where id=' + mysqlid, function (){ shutdown('MySQL error');});
			broadcastSettings();
		}
		console.log('Got an update settings request');
	});
});

//
// Message Functions
//

function broadcastMessage(uname, msg, extra) {
	var message = {"sender": uname, "message": msg};
	messages.push(message);
	
	if (messages.length > maxMessages) {
		messages.splice(0, (messages.length - maxMessages));
	}
	
	if(extra)
	{
		message['extra'] = extra;
	}
	
	for (var i in people) {
		if (people[i].hasVerified() && people[i].getChatSocket()) {
			people[i].getChatSocket().emit('message', message);
		}
	}
};

function broadcastSettings(socket) {
	console.log('Host is ' + gameEngine.getHost());
	if(socket) {
		socket.emit("settings", {"host": gameEngine.getHost(), "maxPlayers": gameEngine.getMaxPlayers(), "guests": gameEngine.getGuests(), "chat": chat, "maxCoins": gameEngine.nextMaxCoins, "lives": gameEngine.nextLives, "maxWins": gameEngine.nextMaxScore, "itemSettings": gameEngine.nextItemSettings, "difficulty": gameEngine.nextDifficulty, "passwordLength": password.length, "servertime": new Date().getTime()});
		return;
	}
	
	for (var i in people) {
		if (people[i].hasVerified()) {
			people[i].getGameSocket().emit("settings", {"host": gameEngine.getHost(), "maxPlayers": gameEngine.getMaxPlayers(), "guests": gameEngine.getGuests(), "chat": chat, "maxCoins": gameEngine.nextMaxCoins, "lives": gameEngine.nextLives, "maxWins": gameEngine.nextMaxScore, "itemSettings": gameEngine.nextItemSettings, "difficulty": gameEngine.nextDifficulty, "passwordLength": password.length, "servertime": new Date().getTime()});
		}
	}
};

function broadcastPeople() {
	var data = [];
	for(var i in people) {
		if(people[i] && people[i].hasVerified()) {
			data.push({username: people[i].getUsername(), usernameColor: people[i].getUsernameColor()});
		}
	}
	
	for (var i in people) {
		if (people[i].hasVerified() && people[i].getChatSocket()) {
			people[i].getChatSocket().emit("people", data);
		}
	}
};

function broadcastServerMessage(msg) {
	broadcastMessage(serverMessageObject, msg);
};

broadcastServerMessage(emoticonManager.parseString("This game is now running :)"));
console.log("This game is now running on port "+port+"! :)");

function emitGameData(object,socket) {
	if(socket)
	{
		var socketid = getSocketId(socket.id);
	}
	if(socket && people[socketid] && people[socketid].hasVerified()) {
		socket.emit('gamedata',object);
		return;
	}
	
	for (var i in people) {
		if (people[i].hasVerified()) {
			people[i].getGameSocket().emit('gamedata', object);
		}
	}
};

//
// Shutdown Code
//

process.on('SIGTERM', function () {
  startshutdown(0, "OS killed node");
});


var shuttingdown = false;

function startshutdown(code,closingMessage) {
	if(shuttingdown) {
		return;
	}
	
	shuttingdown = true;
	console.log("Closing");
	
	if (closingMessage) {
		console.log('Closing message: ' + closingMessage);
	}
		
	nspGame.emit('shutdown','This room is being closed, you are now being redirected back to the menu');
	
	var part2 = function() {
		// Close all sockets
		for(var i in gameSockets) {
			gameSockets[i].disconnect();
		}

		
		setTimeout(shutdown,10000);
	}
	
	if(mysqlid) {
		mysql_query('Delete from trashbattle.sessions where game='+ mysqlid);
		mysql_query('Delete from trashbattle.games where id='+ mysqlid,null,true,part2);
	} else {
		part2();
	}
};

function shutdown(code, closingMessage) {
	sessionManager.disconnect();
	console.log('Server shut off.');
	
	if(code) {
		process.exit(code);
	} else {
		process.exit(0);
	}
	
	setTimeout(function () {process.exit(1);}, 1000);
};

function checkloop() {
	// Checks if the game should be closed
	
	var timeDifference = (new Date().getTime() - runningSince)/1000;
	var amountOfPeople = 0;
	var hostActive = false;
	var possibleHost = null;
	var possibleHostId = 0;
	for(var i in people) {
		amountOfPeople++;
		
		if(people[i].getUsername() == gameEngine.getHost()) {
			hostActive = true;
		} else if (!possibleHost) {
			if(!people[i].isGuest()) {
				possibleHost = people[i].getUsername();
				possibleHostId = people[i].getUserId();
			}
		}
	}
	
	console.log('This game has been running for ' + timeDifference + ' seconds and there are ' + amountOfPeople + ' people active');
	
	console.log('The game host is ' + gameEngine.getHost());
	
	if(hostActive) {
		console.log('The host is ACTIVE');
	} else {
		console.log('The host is not here! Next possible host would be: ' + possibleHost);
		if(possibleHost)
		{
			// Change the game host
			gameEngine.setHost(possibleHost);
			console.log('Changing the host to ' + possibleHost);
			mysql_query('UPDATE trashbattle.games set host='+possibleHostId+' where id='+mysqlid,function(){startshutdown('MySQL error');});
			broadcastSettings();
		}
	}
	
	if(timeDifference > 120) {
		if(amountOfPeople == 0) {
			startshutdown(0,'There\'s nobody active, let\'s close the game');
		}
	}
	
	// Check again in 10 seconds
	setTimeout(function () {checkloop();}, 10000);
};


olai.expose.broadcastMessage = broadcastMessage
olai.expose.broadcastServerMessage = broadcastServerMessage
olai.expose.gameEngine = gameEngine
olai.expose.people = people
olai.expose.gameSockets = gameSockets




checkloop();
gameEngine.setEmitCallback(emitGameData);
gameEngine.setShutdownCallback(startshutdown);
gameEngine.tick(new Date().getTime());
