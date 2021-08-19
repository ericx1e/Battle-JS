var Soldier = function(x, y) {
    Troop.apply(this, arguments);
    this.mhp = 1000;
    this.hp = this.mhp;
    this.atk = 100;
    this.atkRange = 35;
    this.atkSpd = 15;
    this.initAtk = random()*this.atkSpd;
    this.size = 20;
    this.spd = 5;

    if (this.constructor === Troop) {
      throw new Error("Can't instantiate abstract class!");
    }
};

Soldier.prototype = Object.create(Troop.prototype);
Soldier.prototype.constructor = Soldier;

Soldier.prototype.move = function() {
    this.vel = createVector(mouseX-this.pos.x, mouseY-this.pos.y).limit(this.spd);
    this.pos.add(this.vel);
}

Soldier.prototype.show = function(c) {
    this.showSettings(c);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
}

Soldier.prototype.attack = function() {
}