var md5 = require('./md5.js');
var player = require('./player.js');

var guestnum = 1;

function user(socketid) {
    if (socketid != undefined) { //osl This protects class extension from incrementing the guestnum
        this.guest = true;
        this.userid = 0;
        this.username = 'Guest ' + guestnum;
        this.usernameColor = 'red';
        this.socketid = socketid;
        this.verified = false;
        this.moderator = false;
        this.god = false;
		this.coins = 0;
		this.ranking = 0;
        this.gamesocket = null;
        this.chatsocket = null;
        this.ip = "0.0.0.0";
        guestnum++;
    }
}

user.prototype.verifyUser = function(loggedin, id, username, usernameColor, moderator, god, coins, ranking, gamesocket, ip) {
	this.verified = true;
	this.username = username;
	this.usernameColor = usernameColor;
	this.gamesocket = gamesocket;
	this.ip = ip;
	if(loggedin) {
		this.guest = false;
		this.userid = id;
		this.moderator = moderator;
		this.god = god;
		this.coins = coins;
		this.ranking = ranking;
	}
}

user.prototype.getGameSocket = function(){
	return this.gamesocket;
}

user.prototype.getChatSocket = function(){
	return this.chatsocket;
}

user.prototype.getIp = function(){
	return this.ip;
}

user.prototype.hasVerified = function() {
	return this.verified;
}

user.prototype.isModerator = function() {
	return this.moderator;
}

user.prototype.isGod = function() {
	return this.god;
}

user.prototype.isGuest = function() {
	return this.guest;
}

user.prototype.isAI = function() {
    return false;
}

user.prototype.getUsername = function () {
  return this.username;
};

user.prototype.getUserId = function() {
	return this.userid;
}

user.prototype.getCoins = function() {
	return this.coins;
}

user.prototype.getRanking = function() {
	return this.ranking;
}

user.prototype.getUsernameColor = function() {
	return this.usernameColor;
}

user.prototype.setUsernameColor = function(newColor) {
	this.usernameColor = newColor;
}

user.prototype.getData = function() {
	return {"username": this.getUsername(), "usernameColor": this.getUsernameColor(), "userid": this.getUserId()};
}

user.prototype.getPlayerObject = function() {
	return new player(this.getUsername(),this.getUserId(), this.getCoins(), this.getRanking(), this.socketid, this);
}

module.exports = user;