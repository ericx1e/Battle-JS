function CastleWall(x, y, team, numArchers = 3) {
  this.pos = createVector(x, y);

  this.reset = function () {
    this.name = 'castlewall';
    this.team = team;
    this.cost = 100;
    this.projectiles = team === 'red' ? redProjectiles : blueProjectiles;

    this.vel = createVector(0, 0);
    this.size = height / 10;        // body size
    this.troopSize = width / 100;   // UI/detail scale
    this.speed = 0;
    this.maxSpeed = 0;
    this.target = this;

    this.maxHitpoints = 1600;
    this.hitpoints = this.maxHitpoints;
    this.targetHitpoints = this.hitpoints;

    this.attackRange = this.size * 40;
    this.takingDamageFrames = 0;
    this.isDead = false;

    this.numArchers = constrain(numArchers|0, 2, 3);
    this.garrison = [];

    this.facing = (this.team === 'red') ? +1 : -1;

    this._lastHP = this.hitpoints;
    this._floaties = [];

    this._buildGarrison();
  };

  this._buildGarrison = function () {
    this.garrison.length = 0;
    const totalSpan = this.size * 0.6;
    const gap = (this.numArchers > 1) ? totalSpan / (this.numArchers - 1) : 0;

    for (let i = 0; i < this.numArchers; i++) {
      const oy = -this.size * 0.35 + i * gap;
      const ox = this.size * 0.12 * this.facing;

      const a = new Archer(this.pos.x + ox, this.pos.y + oy, this.team);
      a.name = 'garrison_archer';
      a.isGarrison = true;
      a.speed = 0;
      a.maxSpeed = 0;
      a.attackRange = max(a.attackRange, this.attackRange);
      a.firstAttackFrame = (a.firstAttackFrame || 0) + floor(random(0, a.attackSpeed || 60));
      a.projectiles = this.projectiles;

      this.garrison.push({ a, ox, oy });
    }
  };

  this.reset();

  // ---------------- visuals ----------------
  this.show = function (tranparency) {
    push();
    translate(this.pos.x, this.pos.y);
    rectMode(CENTER);
    noStroke();

    // --- GLOBAL vertical gradient so stacked walls look continuous ---
    push();
    const gg = drawingContext.createLinearGradient(0, -this.pos.y, 0, height - this.pos.y);
    gg.addColorStop(0.00, '#768096');
    gg.addColorStop(0.35, '#b7c1d2');
    gg.addColorStop(0.65, '#c9d2df');
    gg.addColorStop(1.00, '#6a748a');
    drawingContext.fillStyle = gg;
    rect(0, 0, this.size, this.size, this.size * 0.08);
    pop();

    // facing-side depth stripe
    fill(0, 28);
    const stripeX = this.facing * this.size * 0.22;
    rect(stripeX, 0, this.size * 0.44, this.size);

    // global-aligned brick lines
    stroke(255, 20);
    strokeWeight(max(1, this.size * 0.012));
    const rowH = this.size * 0.22;
    let yStart = this.pos.y - this.size * 0.5;
    const first = yStart - (yStart % rowH);
    for (let y = first; y <= this.pos.y + this.size * 0.5; y += rowH) {
      line(-this.size * 0.46, y - this.pos.y, this.size * 0.46, y - this.pos.y);
    }
    noStroke();

    // crenellations on the UPWARD edge, right side
    const rightX = this.size * 0.4;
    const crenW = this.size * 0.12;
    const crenH = this.size * 0.18;
    for (let i = -2; i <= 2; i++) {
      const cy = i * this.size * 0.20;
      fill(255, 160);
      rect(rightX, cy, crenW, crenH, 3);
      fill(0, 30);
      rect(
        rightX + crenW * 0.12,
        cy - crenH * 0.16,
        crenW * 0.6,
        crenH * 0.32,
        2
      );
    }

    // cracks intensify with damage
    const dmgPct = 1 - constrain(this.hitpoints / this.maxHitpoints, 0, 1);
    if (dmgPct > 0) {
      push();
      stroke(0, 22 + 110 * dmgPct);
      strokeWeight(max(1, this.size * 0.006));
      noFill();
      const s = this.size * 0.42, o = this.size * 0.18;
      line(-s, -s + o, -s * 0.2, -s * 0.2);
      line(s * 0.2, -s * 0.1, s, -s + o);
      line(-s + o, s * 0.1, -s * 0.1, s - o);
      line(s * 0.1, s - o, s - o, s * 0.05);
      line(-s * 0.2, -s * 0.2, -s * 0.05, -s * 0.35);
      line(s * 0.2, -s * 0.1, s * 0.1, -s * 0.3);
      pop();
      fill(0, 30 * dmgPct);
      rect(0, 0, this.size * 0.98, this.size * 0.98, this.size * 0.08);
    }

    // hit flash
    if (this.takingDamageFrames > 0) {
      fill(255, map(this.takingDamageFrames, 0, 10, 0, 110));
      rect(0, 0, this.size, this.size, this.size * 0.08);
      this.takingDamageFrames--;
    }

    // floating damage numbers
    for (let i = 0; i < this._floaties.length; i++) {
      const f = this._floaties[i];
      push();
      noStroke();
      fill(255, 0, 0, f.alpha);
      textAlign(CENTER, BOTTOM);
      textSize(max(12, this.size * 0.16));
      text(f.text, f.x - this.pos.x, f.y - this.pos.y);
      pop();
    }

    pop();

    // draw garrison archers
    for (let i = 0; i < this.garrison.length; i++) {
      const g = this.garrison[i];
      g.a.show(tranparency);
    }

    // health bar
    if (healthBars) {
      const pct = constrain(this.hitpoints / this.maxHitpoints, 0, 1);
      const w = this.size * 0.9, h = max(3, this.size * 0.12);
      const x = this.pos.x - w/2, y = this.pos.y - this.size * 0.75;
      noStroke(); fill(30, 160); rect(x, y, w, h, h/2);
      fill( lerpColor(color(255,60,60), color(80,220,120), pct) );
      rect(x, y, w * pct, h, h/2);
    }
  };

  // ---------------- logic ----------------
  this.update = function (allies, foes) {
    if (this.isDead) return;

    for (let i = 0; i < this.garrison.length; i++) {
      const g = this.garrison[i];
      g.a.pos.x = this.pos.x + g.ox;
      g.a.pos.y = this.pos.y + g.oy;
      g.a.speed = 0;
      g.a.maxSpeed = 0;
      if ((battleFrameCount + i * 7) % 10 === 0) {
        updateToClosestTarget(g.a, foes);
      }
      g.a.update([], foes);
    }

    if (this.hitpoints <= 0) this.isDead = true;

    // detect incoming damage
    if (this.hitpoints < this._lastHP) {
      const dmg = this._lastHP - this.hitpoints;
      this._floaties.push({
        x: this.pos.x + random(-this.size * 0.15, this.size * 0.15),
        y: this.pos.y - this.size * 0.55,
        vy: -this.size * 0.01,
        alpha: 255,
        text: `-${dmg|0}`
      });
      this.takingDamageFrames = 10;
    }
    this._lastHP = this.hitpoints;

    // animate floaties
    for (let i = this._floaties.length - 1; i >= 0; i--) {
      const f = this._floaties[i];
      f.y += f.vy;
      f.alpha -= 8;
      if (f.alpha <= 0) this._floaties.splice(i, 1);
    }
  };
}
