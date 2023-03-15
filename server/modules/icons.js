var icons = [];
var gameEngine;

var iconsManager = {
	add: function (role, filename) {
		icons[role] = filename;
	},
	exists: function (role) {
		if (icons[role] && icons[role] != null) {
			return true;
		}
		return false;
	},
	remove: function (role) {
		if (exists(role)) {
			icons.splice(role, 1);
		}
	},
	parseUser: function (user) {
		var isPlayer = false;
		var players = gameEngine.getPlayers();
		for(var i in players) {
			if (players[i]) {
				var player = players[i];
				if (user.getUsername() == player.getUsername()) {
					isPlayer = true;
					break;
				}
			}
		}
		var res = user.getData();
		if (user.isModerator() && isPlayer) {
			res.icon = icons['player-moderator'];
			return res;
		} else if (isPlayer) {
			res.icon = icons['player'];
			return res;
		} else if (user.isModerator()) {
			res.icon = icons['moderator'];
			return res;
		} else if (user.getUsername() == gameEngine.getHost()) {
			res.icon = icons['host'];
			return res; 
		} else {
			return res;
		}
	},
	setGameEngine: function (ge) {
		gameEngine = ge;
	}
}

iconsManager.add('host', 'gamehost.png');
iconsManager.add('moderator', 'crown.gif');
iconsManager.add('player', 'player.png');
iconsManager.add('player-moderator', 'playerwithcrown.png');

module.exports = iconsManager;