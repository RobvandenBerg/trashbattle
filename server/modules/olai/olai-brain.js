function olaiBrain(self) {
    this.self = self;

    this.scheduled = [];
    this.schedulerIDNext = 0;

    this.interval = setInterval(this.brainTick.bind(this), olaiBrain.TUNING.tickInterval);

    this.pressed = {hold: false, left: false, right: false, jump: false};

    this.tick = 0;

    this.ranLastTick = {};

    this.player = X.gameEngine.players[self.getGameEnginePlayerObjectKey()];

    if (this.player == null) {
        throw "Player is null.";
    }

    this.locks = {};

    this.stategraph = new olai.stategraph.AIStategraph(this.player, this, self);
}

var floor = require('../floor.js');
var trashcan = require('../trashcan.js');
var enemy = require('../enemy.js');


var X = olai.expose;


olaiBrain.TUNING = {
    tickInterval: 200,
};


olaiBrain.prototype.schedule = function (ticks, action, params) {
    this.scheduled.push([this.tick + ticks, action, params, ++this.schedulerIDNext]);
    return this.schedulerIDNext;
}

olaiBrain.prototype.press = function (key) {
    this.player.inputDown(key);
    this.pressed[key] = true;
}
olaiBrain.prototype.pressTime = function (key, ticks) {
    this.player.inputDown(key);
    this.pressed[key] = true;
    this.schedule(ticks, this.release, [key]);
}
olaiBrain.prototype.release = function (key) {
    this.player.inputUp(key);
    this.pressed[key] = false;
}


function testCollisionAABBAABB(xa1, ya1, xa2, ya2, xb1, yb1, xb2, yb2) {
	return (xa1 < xb2) && (xa2 > xb1) && (ya1 < yb2) && (ya2 > yb1);
}

function average(a, b) {
    return (a + b) / 2;
}


var binEscapeTry = {
    cond: function () {
        return this.player.intrashcan
    },
    main: function () {
        if (this.tick % 2 == 0) {
            this.pressTime('left', 1);
            this.pressTime('jump', 1);
        } else {
            this.pressTime('right', 1);
        }
    },
    pre: function() {
        this.press('hold');
    },
    post: function() {
        this.self.sendMessage("I got out of the bin!");
    }
}

var assessRisks = {
    cond: function () {
        return ! this.player.intrashcan; // if we are in the trash, we don't need to do any risk assessment
    },
    main: function () {
        // first, find ENEMIES and mark them as -5 (5 danger)

        var risks = [];

        for (var i in X.gameEngine.enemies) {
            var e = X.gameEngine.enemies[i];

            if (e == null) continue;

            if (e.intrashcan) continue; // this poses no risk to us
            // TODO mark the trash can as a potential source of coins by marking it as a reward if enemy in bin

            if (e.stunned) continue; // currently no risk
            // TODO mark as reward maybe? Or should we leave this to the EnemyDisposer?

            // add a margin in the direction they are going so when the enemy moves, we are still safe
            switch (e.direction) {
                case 'left':
                    risks.push([e.x - 24, e.y, e.x + e.enemyWidth, e.y + e.enemyHeight, -5]);
                break;
                case 'right':
                    risks.push([e.x, e.y, e.x + e.enemyWidth + 24, e.y + e.enemyHeight, -5]);
                break;
                default:
                    this.self.sendMessage('(def) ' + JSON.stringify(e.direction));
            }
        }

        for (var i in X.gameEngine.items) {
            var e = X.gameEngine.items[i];

            if (e == null) continue;

            if (e.intrashcan) continue; // this poses no risk to us

            if (e.character == 'bowlingball' && e.speedX != 0) { // danger !!! Moving bowlingball
                // add a margin in the direction they are going so when the enemy moves, we are still safe
                switch (e.direction) {
                    case 'left':
                        risks.push([e.x - 128, e.y, e.x + e.itemWidth, e.y + e.itemHeight, -5]);
                    break;
                    case 'right':
                        risks.push([e.x, e.y, e.x + e.itemWidth + 128, e.y + e.itemHeight, -5]);
                    break;
                    default:
                        this.self.sendMessage('(def) ' + JSON.stringify(e.direction));
                }
            }
        }

        console.log(risks.length + ' risks identified');
        console.log(JSON.stringify(risks));
        console.log('me: ' + JSON.stringify(this.player));

        this.risks = risks;
    }
}

var avoidRisks = {
    cond: function () {
        return this.risks.length > 0;
    },
    main: function () {
        var l = this.risks.length;

        var shouldGo = '';
        var shouldJump = false;

        var p = [this.player.x, this.player.y, this.player.x + this.player.playerWidth, this.player.y + this.player.playerHeight];

        for (var i = 0; i < l; ++i) {
            var r = this.risks[i];

            // TODO this risk evading is a bit lousy. I expect to replace this in the future.

            if (testCollisionAABBAABB(r[0], r[1], r[2], r[3], p[0], p[1], p[2], p[3])) {
                // DANGER! Dodge this NOW!

                this.self.sendMessage('Risk collision');

                if (testCollisionAABBAABB(r[0], r[1], r[2], r[3], p[0] - 32, p[1], p[2] - 32, p[3])
                 && testCollisionAABBAABB(r[0], r[1], r[2], r[3], p[0] + 32, p[1], p[2] + 32, p[3])
                 && !testCollisionAABBAABB(r[0], r[1], r[2], r[3], p[0], p[1] - 150, p[2], p[3] - 150)) {
                    // JUMP + go either left or right - might be best move here
                    shouldJump = true;
                }

                if (average(p[0], p[2]) < average(r[0], r[2])) {
                    shouldGo = 'left';
                    break;
                } else {
                    shouldGo = 'right';
                    break;
                }
            }
        }

        if (shouldGo != '') {
            this.pressTime(shouldGo, 5);
            if (shouldJump) {
                this.pressTime('jump', 1);
            }
        }
    }
}

olaiBrain.prototype.brainNodes = [
    assessRisks,
    avoidRisks,
];

olaiBrain.prototype.brainTick = function () {
    // console.log('OLAI: Brain Tick');

    ++this.tick;

    if (this.player.dead) {
        // the player is dead - free brain
        this.shouldFree = true;
        return;
    }

    // first check the scheduler

    if (this.scheduled == null) {
        console.warn('Scheduled is null. What gives? @ ' + this.tick);
        console.warn(this);
        return;
    }

    var l = this.scheduled.length;

    for (var i = l-1; i >= 0; --i) {
        if (this.tick >= this.scheduled[i][0]) {
            this.scheduled[i][1].apply(this, this.scheduled[i][2]);
            this.scheduled.splice(i, 1);
        }
    }

    // now run through the brain

    var l = this.brainNodes.length;

    for (var i = 0; i < l; ++i) {
        var shouldExec = (typeof this.brainNodes[i].cond == 'function' ? this.brainNodes[i].cond.apply(this, []) : true);

        if (shouldExec) {
            if (! this.ranLastTick[i]) { // if the action has only just started running, we should call pre
                if (this.brainNodes[i].pre) {
                    this.brainNodes[i].pre.apply(this, []);
                }
            }

            this.brainNodes[i].main.apply(this, []);
        } else {
            if (this.ranLastTick[i]) { // if the action has stopped running, we should call post
                if (this.brainNodes[i].post) {
                    this.brainNodes[i].post.apply(this, []);
                }
            }
        }

        this.ranLastTick[i] = shouldExec;
    }

    // now check the stategraph

    if (typeof this.stategraph.states[this.stategraph.currentState].update == 'function') {
        this.stategraph.states[this.stategraph.currentState].update.apply(this.stategraph, [this.tick]);
    }
}


olaiBrain.prototype.free = function () {
    if (this.interval) {
        clearInterval(this.interval);
    }
}


olaiBrain.resolve = function (unresolved) {
    if (typeof unresolved == 'function') {
        return unresolved()
    } else {
        return unresolved
    }
}


module.exports = olaiBrain;