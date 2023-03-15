var olaiFakeSocket = {
    IDRegistry: {
        next:-1,
        getNewID: function () {
            return olaiFakeSocket.IDRegistry.next--;
        }
    },
    CommonFakeSocket: function() {
        this.id = olaiFakeSocket.IDRegistry.getNewID();
    },
    ChatFakeSocket: function() {
        olaiFakeSocket.CommonFakeSocket.apply(this);
    },
    GameFakeSocket: function(incomingHandler) {
        olaiFakeSocket.CommonFakeSocket.apply(this);
        this.emitCalls = {};
        this.outgoQueue = [];
        this.incomingHandler = incomingHandler;
    },
}

olaiFakeSocket.CommonFakeSocket.prototype.handshake = {
    address: {
        address: '0.0.0.0',
        port: -1,
    }
}

olaiFakeSocket.CommonFakeSocket.prototype.disconnect = function () {
    // NOP - nothing to do when disconnected really
}

olaiFakeSocket.ChatFakeSocket.prototype = new olaiFakeSocket.CommonFakeSocket();
olaiFakeSocket.GameFakeSocket.prototype = new olaiFakeSocket.CommonFakeSocket();

olaiFakeSocket.ChatFakeSocket.prototype.emit = function (emissionType, emission) {
    // we currently don't care about all the going-ons in chat
    // NOP
}

olaiFakeSocket.ChatFakeSocket.prototype.on = function (evt, handle) {
    // NOP
}

olaiFakeSocket.GameFakeSocket.prototype.emit = function (emissionType, emission) {
    this.incomingHandler(emissionType, emission);

    if (this.outgoQueue == null) return;

    while (this.outgoQueue.length > 0) {
        var sending = this.outgoQueue.shift();

        if (this.emitCalls[sending.emissionType] == undefined) {
            // this emission handler has vanished
            console.warn('An emission handler type has vanished ("' + sending.emissionType + '"). This is almost certainly a bug!');
            continue;
        }

        this.emitCalls[sending.emissionType](sending.emission);
    }
}

olaiFakeSocket.GameFakeSocket.prototype.on = function (emissionType, emissionHandler) {
    this.emitCalls[emission] = emissionHandler;
}

olaiFakeSocket.GameFakeSocket.prototype.outgoing = function (emissionType, emission) {
    if (this.emitCalls[emissionType] == undefined) {
        // this emission handler isn't here
        console.warn('An emission handler type was not available ("' + emissionType + '"). This is almost certainly a bug!');
        return false;
    }

    // this.emitCalls[emissionType](emission);
    // it could cause infinite recursion if we do this
    // instead, add to queue

    this.outgoQueue.push({emissionType: emissionType, emission: emission});
}

module.exports = olaiFakeSocket;