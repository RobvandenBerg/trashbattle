var user = require('../user.js');

function olaiUser(socketID) {
    user.apply(this, [socketID]);

    this.verified = true;

    this.setUsernameColor('#88eebb');
}

olaiUser.prototype = new user(); // extend 'user'

olaiUser.prototype.getUsername = function() {
    return '*OLAI-' + Math.abs(this.socketid);
}

olaiUser.prototype.isAI = function() {
    return true;
}

module.exports = olaiUser;