var standardport = 2000;
var port = parseInt(process.argv[2]);

if (isNaN(port)) {
	port = standardport;
}

var io = require('socket.io').listen(port);
//server.set("log level", 1);
console.log('listening on *:' + port);

var people = {};
var messages = [];

var nspChat = io.of('/chat');
nspChat.on('connection', function(socket) {
	var address = socket.handshake.address;
	console.log('New chat connection from ' + address.address + ':' + address.port);
	
	socket.emit('message-log', messages);
  
	socket.on("join", function(name) {
		people[socket.id] = {"name" : name};
		socket.emit("message", {"name" : "Server"}, "You have connected to the server.");
		socket.broadcast.emit("message", {"name" : "Server"}, people[socket.id].name + " is online.")
		nspChat.emit("people", people);
	});
  
	socket.on('message', function(msg) {
		if (people[socket.id]) {
			console.log('message: ' + msg);
			messages.push({"sender" : people[socket.id], "message" : msg});
			nspChat.emit("message", people[socket.id], msg);
		}
		else {
			socket.emit("hacker", "Don't change our js code");
		}
	});
	
	socket.on('disconnect', function() {
		console.log('user chat connection from ' + address.address + ':' + address.port + ' disconnected');
		if (people[socket.id]) {
			nspChat.emit("message", {"name" : "Server"}, people[socket.id].name + " has left the server.");
			delete people[socket.id];
			nspChat.emit("people", people);
		}
	});
});

var nspGame = io.of('/game');
nspGame.on('connection', function(socket) {
	var address = socket.handshake.address;
	console.log("New game connection from " + address.address + ":" + address.port);
  
	socket.on('message', function(msg) {
		console.log('message: ' + msg);
	});
	
	socket.on('disconnect', function() {
		console.log('user game connection from ' + address.address + ':' + address.port + ' disconnected');
	});
});