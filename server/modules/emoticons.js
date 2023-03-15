var emoticons = [];

var emoticonManager = {
	add: function (characters, filename) {
		emoticons[characters] = filename;
	},
	exists: function (characters) {
		if (emoticons[characters] && emoticons[characters] != null) {
			return true;
		}
		return false;
	},
	remove: function (characters) {
		if (exists(characters)) {
			emoticons.splice(characters, 1);
		}
	},
	parseString: function (string) {
		var message = string;
		for(var key in emoticons) {
			message = message.split(key).join('<img src="images/emoticons/' + emoticons[key] + '">');
		}
		return message;
	}
}

emoticonManager.add(':D', 'bigsmile.gif');
emoticonManager.add(':P', 'happy.gif');
emoticonManager.add(':)', 'happy.gif');

module.exports = emoticonManager;