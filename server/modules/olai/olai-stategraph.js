var olaiStategraph = function (states) {
    this.states = states;
    this.olaiInstance = null;
}

var X = olai.expose;

olaiStategraph.prototype.goToState = function (state, args) {
    if (! this.states[state]) {
        X.broadcastServerMessage('Invalid Stategraph State: ' + state);
    }
    if (this.currentState) {
        if (this.states[this.currentState].leave) {
            this.states[this.currentState].leave.apply(this, [state]);
        }
    }
    var lastState = this.currentState;
    this.currentState = state;
    if (this.states[state].enter) {
        this.states[state].enter.apply(this, [args, lastState]);
    }

    if (this.olaiInstance) this.olaiInstance.sendMessage("Stategraph: " + this.lastState + " => " + this.currentState);
}



olaiStategraph.AIStategraph = function (player, brain, olaiInstance) {
    this.player = player;
    this.brain = brain;
    this.olaiInstance = olaiInstance;

    this.goToState('init');
}

olaiStategraph.AIStategraph.prototype = new olaiStategraph({
    init: {
        update: function (tick) {
            if (this.player.intrashcan) this.goToState('escapeBin');
        }
    },

    escapeBin: {
        enter: function (args, lastState) {
            this.brain.press('hold');
        },
        update: function (tick) {
            if (! this.player.intrashcan) {
                this.goToState('holdingItem');
                return;
            }
            if (tick % 2 == 0) {
                this.brain.pressTime('left', 1);
                this.brain.pressTime('jump', 1);
            } else {
                this.brain.pressTime('right', 1);
            }
        },
        leave: function (nextState) {

        },
    },

    holdingItem: {
        enter: function (args, lastState) {

        },
        update: function (tick) {
            if (! this.player.holding || this.player.holdingType != 'item') {
                this.goToState('init');
                return;
            }

            var holding = X.gameEngine.items[this.player.holdingId];

            switch (holding.character) {
                case 'fish': // Fish is currently useless - let's just litter it on the ground!
                    this.brain.release('hold');
                    this.olaiInstance.sendMessage('This fish is junk!');
                break;
                default:
                    this.olaiInstance.sendMessage('This item is unrecognised');
            }
        },
        leave: function (nextState) {

        }
    }
});

module.exports = olaiStategraph;