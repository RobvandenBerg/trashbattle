var chat = 
(function () {
		var io = window.io;
		var socket;
		var connection;
		var displayChatFunction;
		var displayPeopleFunction;
	
		var chat = {
			version: 1.0,
			author: "Rob van den Berg, Mitchell Olsthoorn",
			updated: "",
			changeUsernameColor: function(color) {
				socket.emit('usernameColor',color);
			},
			connect: function (url, dcf, dpf) {
				if (connection != null) {
					this.disconnect();
				}
				
				displayChatFunction = dcf;
				displayPeopleFunction = dpf;
				
				var ip = url + '/chat';
				socket = io.connect(ip);
				
				if (socket != null) {
					connection = ip;
				}
			
				socket.on('message', function (data) {
					if (data.extra && data.extra.wtf) {
						if(sound)
						{
							playSound('wtfSound');
						}
						displayChatFunction(data,true);
					}
					else
					{
						displayChatFunction(data);
					}
					
				});
				
				socket.on('message-log', function (data) {
					data.forEach(displayArrayElements);
					function displayArrayElements(element, index, array) {
						displayChatFunction(element,true);
					}
				});
				
				socket.on('people', function (data) {
					displayPeopleFunction(data);
				});
			},
			isConnected: function () {
				if (!socket || socket == null) {
					return false;
				}
				return socket.connected;
			},
			disconnect: function () {
				if (connection && connection != null) {
					socket.disconnect();
					delete io.sockets[connection];
					connection = null;
					io.j = [];
				}
			},
			join: function (name) {
				socket.emit('join', name);
			},
			send: function (msg) {
				socket.emit('message', msg);
			}
		};
     
		return chat;
}());