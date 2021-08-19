var Troop = function(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.mhp;
    this.hp;
    this.atk;
    this.atkRange;
    this.atkSpd;
    this.initAtk;

    if (this.constructor === Troop) {
      throw new Error("Can't instantiate abstract class!");
    }
};

Troop.prototype.move = function() {
    this.pos.add(this.vel);
}

Troop.prototype.show = function() {
    throw new Error("Abstract method!");
}

Troop.prototype.attack = function() {
    throw new Error("Abstract method!");
}

Troop.prototype.showSettings = function(c) {
    colorMode(RGB);
    stroke(c);
    strokeWeight(4);
    c.setAlpha(120);
    fill(c);
}