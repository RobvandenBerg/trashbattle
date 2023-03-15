var nMemcached = require('memcached');
var memcached;

var sessionManager = {
	connected: false,
	connect: function (url) {
		memcached = new nMemcached(url);
		this.connected = true;
	},
	disconnect: function () {
		memcached.end();
		this.connected = false;
	},
	getSession: function (sessionId, callback) {
		memcached.get("sessions/" + sessionId, function(err, result) {
			if (err) {
				console.log(err);
			}
			console.log('Parse this: ' + result);
			var session = JSON.parse(result);
			callback(session);
		});
	}
}

module.exports = sessionManager;