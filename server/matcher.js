var moduleDir = "./modules/";
var htmlentities = require(moduleDir + 'htmlentities.js');
var mysql_query = require(moduleDir + 'mysql.js');
var sessionManager = require(moduleDir + 'memcached.js');
var user = require(moduleDir + 'user.js');
var player = require(moduleDir + 'player.js');
var updateSettings = require(moduleDir + 'settings.js');
var timeConversion = require(moduleDir + 'time-conversion.js');
var mysql_real_escape_string = require(moduleDir + 'mysql-real-escape-string.js');
var fs = require('fs');
var cheats = false;


var BETA = true;
var ALLOW_GUESTS = false;

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

console.log('matcher.js is listening on *:' + port);

var people = [];
var gameSockets = [];

function getSocketId(raw)
{
	var s = raw.split('#');
	return s[1];
}

var nspMatcher = io.of('/matcher');
nspMatcher.on('connection', function (socket) {
	var address = socket.handshake.address;
	console.log('New matcher connection from ' + address.address + ':' + address.port);
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
	
	if(timeDifference > 20) {
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
