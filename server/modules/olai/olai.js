var iconsManager = require('../icons.js');
var playerSelection = require('../playerselection.js');

var olai = {}

global.olai = olai;


olai.expose = {
    broadcastMessage: null,
    broadcastServerMessage: null,
    gameEngine: null,
    people: null,
    gameSockets: null,
};




olai.user = require('./olai-user.js');
olai.stategraph = require('./olai-stategraph.js');
olai.brain = require('./olai-brain.js');
olai.fakeSocket = require('./olai-fakesocket.js');

var X = olai.expose;

olai.instance = function() {
    var chatSocket = new olai.fakeSocket.ChatFakeSocket();
    var gameSocket = new olai.fakeSocket.GameFakeSocket(this.incoming.bind(this));

    this.olaiUser = new olai.user(chatSocket.id);
    this.olaiUser.chatsocket = chatSocket;
    this.olaiUser.gamesocket = gameSocket;

    this.rememberedState = '*';


    X.people[this.olaiUser.socketid] = this.olaiUser;
    // gameSockets is a misleading name used in game.js in the chat handling section
    // do not be fooled - these are actually CHAT sockets, not GAME sockets
    X.gameSockets[this.olaiUser.socketid] = this.olaiUser.chatsocket;

    if (X.gameEngine.join(this.olaiUser.getPlayerObject())) {
        // successfully injected into the lobby
    } else {
        // failed to join game
        // TODO handle this
        console.warn('OlAI: Failed to join game');
        this.sendMessage('Unable to join game: gameEngine.join returned false');
        this.endConnection();
    }
}

olai.instance.prototype.getGameEnginePlayerObjectKey = function () {
    for (var i in X.gameEngine.players) {
        if (X.gameEngine.players[i].getUsername() == this.olaiUser.getUsername()) {
            return i;
        }
    }

    console.warn('OLAI: Unable to find AI Player in X.gameEngine.players!');

    return null;
}

olai.instance.prototype.sendMessage = function (message, extra) {
    X.broadcastMessage(iconsManager.parseUser(this.getOlaiUser()), message, extra);
}

olai.instance.prototype.endConnection = function () {
    delete X.gameSockets[this.olaiUser.socketid];

    // just in case, empty fakesocket
    this.olaiUser.gamesocket.outgoQueue = null;
    this.olaiUser.gamesocket.emitCalls = null;
    this.olaiUser.gamesocket.incomingHandler = null;

    // Leave the gameEngine
    X.gameEngine.leave(this.olaiUser.socketid, true);

    // Send a message that this AI was disengaged
    if (X.people[this.olaiUser.socketid]) {
        X.broadcastServerMessage(X.people[this.olaiUser.socketid].getUsername() + ' disengaged and disconnected!');
        delete X.people[this.olaiUser.socketid];
    }
}

olai.instance.prototype.incoming = function (emissionType, emission) {

    if (emissionType == 'gamedata') {
        switch (emission.state) {
            case 'lobby':
                // Check if we are on the player list
                // if not, attempt to join
                // if unable to join, leave the game
                // if all players are AI players, also leave the game

                var shouldLeave = true;

                for (var i in X.gameEngine.players) {
                    if (! X.people[X.gameEngine.players[i].socketid].isAI()) {
                        shouldLeave = false;
                    }
                }

                if (shouldLeave) {
                    this.sendMessage('Leaving: no non-AI players remaining');
                    this.endConnection();
                }
            break;
            case 'playerselection':
                if (! playerSelection.cutoff) {
                    playerSelection.cutOff();
                }
            break;
            case 'game':
                if (this.brain && this.brain.shouldFree) {
                    this.freeGameState();
                }
            break;
        }

        if (this.rememberedState != emission.state) {
            switch (emission.state) {
                case 'game':
                    this.initGameState();
                break;
            }
            switch (this.rememberedState) {
                case 'game':
                    if (this.brain) this.freeGameState();
                break;
            }
        }

        this.rememberedState = emission.state;
    }

    console.log("OlAI Incoming: " + JSON.stringify([emissionType, emission]));
}

olai.instance.prototype.emit = function (emissionType, emission) {

}

olai.instance.prototype.initGameState = function () {
    this.brain = new olai.brain(this);
    X.broadcastMessage(iconsManager.parseUser(this.getOlaiUser()), 'Brain created');
}

olai.instance.prototype.freeGameState = function () {
    this.brain.free();
    X.broadcastMessage(iconsManager.parseUser(this.getOlaiUser()), 'Brain freed');
    delete this.brain;
}

olai.instance.prototype.getOlaiUser = function () {
    return this.olaiUser;
}

module.exports = olai;