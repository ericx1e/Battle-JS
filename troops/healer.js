const HEALER_CFG = {
  retargetEveryFrames: 10,  // recompute heal center cadence
  idealStandoff: 70,        // offset heal center away from nearest foe
  safeBuffer: 90,           // threshold to apply stronger offset
  sepRadius: 40,            // healer vs allies separation radius
  sepStrength: 0.35,        // separation weight
  wMissingHP: 1.0,          // target score weights
  wDistance: 0.35,
  wDanger: 0.6,
};

function clampLen2D(v, max) {
  const L = Math.hypot(v.x, v.y) || 1;
  if (L <= max) return createVector(v.x, v.y);
  return createVector((v.x * max) / L, (v.y * max) / L);
}

function nearestLivingEnemyDist2(pos, enemies) {
  let best = Infinity;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e || e.isDead) continue;
    const d2 = distSquared(pos, e.pos);
    if (d2 < best) best = d2;
  }
  return best;
}

function isHealableUnit(u) {
  if (!u || u.isDead) return false;
  if (u.name === 'zombie') return false; // skip expendables (match your current intent)
  if (u.maxHitpoints == null || u.hitpoints == null) return false;
  return u.hitpoints < u.maxHitpoints * 0.985; // avoid micro top-ups
}

// returns { center: p5.Vector|null, primary: ally|null }
function pickHealCenter(healer, allies, foes) {
  let wx = 0, wy = 0, wsum = 0;
  let best = null, bestScore = -1e9;

  for (let i = 0; i < allies.length; i++) {
    const a = allies[i];
    if (a === healer || !isHealableUnit(a)) continue;

    const missing = a.maxHitpoints - a.hitpoints;
    const d = Math.sqrt(distSquared(healer.pos, a.pos));
    const distPenalty = d / 200;

    const d2e = nearestLivingEnemyDist2(a.pos, foes);
    const danger = (d2e === Infinity) ? 0 : 1 / Math.max(80 * 80, d2e);

    const score =
      HEALER_CFG.wMissingHP * missing
      - HEALER_CFG.wDistance * distPenalty
      + HEALER_CFG.wDanger * danger * 1000;

    const w = missing * (1 / (1 + d));
    wx += a.pos.x * w;
    wy += a.pos.y * w;
    wsum += w;

    if (score > bestScore) { bestScore = score; best = a; }
  }

  if (wsum <= 0) return { center: null, primary: null };

  const center = createVector(wx / wsum, wy / wsum);

  // bias away from nearest foe for safer pool placement
  const d2foe = nearestLivingEnemyDist2(center, foes);
  if (d2foe < HEALER_CFG.safeBuffer * HEALER_CFG.safeBuffer) {
    let nearest = null, bestD2 = Infinity;
    for (let i = 0; i < foes.length; i++) {
      const e = foes[i];
      if (!e || e.isDead) continue;
      const d2 = distSquared(center, e.pos);
      if (d2 < bestD2) { bestD2 = d2; nearest = e; }
    }
    if (nearest) {
      const away = p5.Vector.sub(center, nearest.pos).normalize().mult(HEALER_CFG.idealStandoff);
      center.add(away);
    }
  }

  return { center, primary: best };
}

function separationVector(self, allies) {
  let push = createVector(0, 0);
  for (let i = 0; i < allies.length; i++) {
    const a = allies[i];
    if (!a || a === self || a.isDead) continue;
    const d2 = distSquared(self.pos, a.pos);
    if (d2 === 0 || d2 > HEALER_CFG.sepRadius * HEALER_CFG.sepRadius) continue;
    const dir = p5.Vector.sub(self.pos, a.pos);
    const L = Math.sqrt(d2);
    dir.mult((HEALER_CFG.sepRadius - L) / (HEALER_CFG.sepRadius * (L || 1)));
    push.add(dir);
  }
  push.limit(self.maxSpeed * HEALER_CFG.sepStrength);
  return push;
}

function Healer(x, y, team) {
  this.pos = createVector(x, y);

  this.reset = function () {
    this.name = 'healer';
    this.team = team;
    this.cost = 50;
    this.forces = team == 'red' ? redForces : blueForces;

    this.vel = createVector(0, 0);
    this.size = width / 130;
    this.speed = this.size / 9;
    this.maxSpeed = this.speed;
    this.target = this;

    this.maxHitpoints = 90;
    this.hitpoints = this.maxHitpoints;
    this.targetHitpoints = this.hitpoints;

    this.attackPower = 0;
    this.attackSpeed = 100;            // frames between casts
    this.attackRange = this.size * 5;
    this.firstAttackFrame = parseInt(random(0, this.attackSpeed));

    this.takingDamageFrames = 0;
    this.isDead = false;

    // ai internals
    this._nextRetargetAt = 0;
    this._cachedHealCenter = null;
    this._cachedPrimary = null;
  };

  this.reset();

  this.show = function (tranparency) {
    push();
    translate(this.pos.x, this.pos.y);

    if (healthBars) {
      strokeWeight(this.size / 5);
      stroke(150);
      line(-this.size, -this.size, this.size, -this.size);
      colorMode(HSB, this.maxHitpoints, 255, 255, 255);
      stroke((30 * this.hitpoints) / this.maxHitpoints, 255, 255);
      line(
        -this.size,
        -this.size,
        -this.size + (2 * this.size * this.hitpoints) / this.maxHitpoints,
        -this.size
      );
    }

    drawSettings(team, tranparency, this.size);
    noFill();
    arc(
      0,
      0,
      this.size,
      this.size,
      PI / 2 - (PI * this.hitpoints) / this.maxHitpoints,
      PI / 2 + (PI * this.hitpoints) / this.maxHitpoints,
      OPEN
    );

    drawSettings(team, tranparency, this.size);
    noStroke();
    ellipse(
      0,
      0,
      this.size - (this.size * this.takingDamageFrames) / 100,
      this.size - (this.size * this.takingDamageFrames) / 100
    );

    drawSettings(team, tranparency, this.size);
    noFill();
    beginShape();
    let l = this.size / 6;
    let offsetH = -this.size / 2;
    vertex(-l / 2, offsetH);
    vertex(l / 2, offsetH);
    vertex(l / 2, offsetH - l);
    vertex(l / 2 + l, offsetH - l);
    vertex(l / 2 + l, offsetH - 2 * l);
    vertex(l / 2, offsetH - 2 * l);
    vertex(l / 2, offsetH - 3 * l);
    vertex(-l / 2, offsetH - 3 * l);
    vertex(-l / 2, offsetH - 2 * l);
    vertex(-l / 2 - l, offsetH - 2 * l);
    vertex(-l / 2 - l, offsetH - l);
    vertex(-l / 2, offsetH - l);
    vertex(-l / 2, offsetH);
    endShape();

    if (this.takingDamageFrames > 0) this.takingDamageFrames--;
    pop();
  };

  this.update = function (allies, foes) {
    if (this.isDead) return;

    if (allies.length === 0) {
      this.target = this;
      return;
    }

    if (this.speed < this.maxSpeed) {
      this.speed += this.maxSpeed / 100;
    }

    // retarget on cadence
    if (battleFrameCount >= this._nextRetargetAt) {
      const pick = pickHealCenter(this, allies, foes);
      this._cachedHealCenter = pick.center;   // null if nobody needs heal
      this._cachedPrimary = pick.primary;
      this._nextRetargetAt = battleFrameCount + HEALER_CFG.retargetEveryFrames;
    }

    // movement goal
    let goal = null;
    if (this._cachedHealCenter) {
      const sep = separationVector(this, allies);
      goal = p5.Vector.add(this._cachedHealCenter, sep);
    } else {
      // escort nearest living non-structure ally
      let nearest = null, bestD2 = Infinity;
      for (let i = 0; i < allies.length; i++) {
        const a = allies[i];
        if (!a || a === this || a.isDead || a.name === 'castlewall' || a.name === 'wall') continue;
        const d2 = distSquared(this.pos, a.pos);
        if (d2 < bestD2) { bestD2 = d2; nearest = a; }
      }
      goal = nearest ? nearest.pos.copy() : this.pos.copy();
    }

    moveUnitTowards(this, goal, allies.concat(foes));

    // cast on cadence
    if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed === 0) {
      this.attack(allies);
    }

    if (this.hitpoints <= 0) this.isDead = true;
  };

  this.attack = function (allies) {
    const r2 = this.attackRange * this.attackRange;
    for (let i = 0; i < allies.length; i++) {
      const a = allies[i];
      if (!isHealableUnit(a)) continue;
      if (distSquared(this.pos, a.pos) <= r2) {
        this.forces.push(new HealPool(this.pos.x, this.pos.y, this.attackRange, this.team));
        return;
      }
    }
    // nobody damaged in range → skip this frame (saves particles / CPU)
  };
}