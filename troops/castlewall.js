function CastleWall(x, y, team, numArchers = 3) {
    this.pos = createVector(x, y);

    this.reset = function () {
        this.name = 'castlewall';
        this.team = team;
        this.cost = BALANCE.castlewall.cost;
        this.projectiles = team === 'red' ? redProjectiles : blueProjectiles;

        this.vel = createVector(0, 0);
        this.size = height / 10;        // body size
        this.troopSize = width / 100;   // UI/detail scale
        this.speed = 0;
        this.maxSpeed = 0;
        this.target = this;

        this.maxHitpoints = BALANCE.castlewall.hp;
        this.hitpoints = this.maxHitpoints;
        this.targetHitpoints = this.hitpoints;

        this.attackRange = this.size * 8;
        this.takingDamageFrames = 0;
        this.isDead = false;

        this.numArchers = constrain(numArchers | 0, 2, 3);
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
            a.attackRange = this.attackRange; // capped by the wall, not the archer's open-field range
            a.firstAttackFrame = (a.firstAttackFrame || 0) + floor(random(0, a.attackSpeed || 60));
            a.projectiles = this.projectiles;

            this.garrison.push({ a, ox, oy });
        }
    };

    this.reset();

    // ---------------- visuals ----------------
    // flat, team-colored masonry in the same language as the dots:
    // outline stroke, fill that drains as it crumbles, simple battlement teeth
    this.show = function (tranparency) {
        push();
        translate(this.pos.x, this.pos.y);
        rectMode(CENTER);

        const pct = constrain(this.hitpoints / this.maxHitpoints, 0, 1);
        const red = this.team === 'red';
        const a = tranparency || 255;
        const lift = this.size * 0.18; // masonry MASS: the rampart rides above its footprint

        // shadow pooled at the base
        noStroke();
        fill(0, 90 * a / 255);
        rect(0, lift * 0.6, this.size * 0.82, this.size * 1.02, this.size * 0.08);

        // the wall FACE: darker stone from the ground up to the rampart edge
        strokeWeight(this.size / 30);
        if (red) {
            stroke(190, 110, 110, a);
            fill(140, 62, 62, (70 + 90 * pct) * a / 255);
        } else {
            stroke(110, 110, 190, a);
            fill(62, 62, 140, (70 + 90 * pct) * a / 255);
        }
        rect(0, 0, this.size * 0.72, this.size * 0.96, this.size * 0.08);

        // the rampart top, standing proud of the field
        push();
        translate(0, -lift);
        // opaque slab first — the stone face below must not bleed through
        // the translucent team-colored top
        noStroke();
        fill(39);
        rect(0, 0, this.size * 0.72, this.size * 0.96, this.size * 0.08);
        strokeWeight(this.size / 30);
        if (red) {
            stroke(255, 150, 150, a);
            fill(255, 120, 120, (40 + 110 * pct) * a / 255);
        } else {
            stroke(150, 150, 255, a);
            fill(120, 120, 255, (40 + 110 * pct) * a / 255);
        }
        rect(0, 0, this.size * 0.72, this.size * 0.96, this.size * 0.08);

        // battlement teeth on the field-facing edge
        const teethX = this.facing * this.size * 0.42;
        for (let i = -1; i <= 1; i++) {
            rect(teethX, i * this.size * 0.3, this.size * 0.14, this.size * 0.13, this.size * 0.02);
        }

        // cracks as it takes damage
        if (pct < 0.66) {
            noFill();
            strokeWeight(this.size / 45);
            const s = this.size * 0.28;
            line(-s * 0.8, -s, -s * 0.1, -s * 0.2);
            line(-s * 0.1, -s * 0.2, -s * 0.6, s * 0.5);
            if (pct < 0.33) {
                line(s * 0.5, -s * 0.7, s * 0.1, 0);
                line(s * 0.1, 0, s * 0.55, s * 0.8);
            }
        }

        // hit flash
        if (this.takingDamageFrames > 0) {
            noStroke();
            fill(255, map(this.takingDamageFrames, 0, 10, 0, 110));
            rect(0, 0, this.size * 0.72, this.size * 0.96, this.size * 0.08);
            this.takingDamageFrames--;
        }
        pop();

        // floating damage/repair numbers
        for (let i = 0; i < this._floaties.length; i++) {
            const f = this._floaties[i];
            push();
            noStroke();
            if (f.col) {
                fill(f.col[0], f.col[1], f.col[2], f.alpha);
            } else {
                fill(255, 0, 0, f.alpha);
            }
            textAlign(CENTER, BOTTOM);
            textSize(max(12, this.size * 0.16));
            text(f.text, f.x - this.pos.x, f.y - this.pos.y);
            pop();
        }

        pop();

        // draw garrison archers standing ON the rampart (drawn lift only —
        // their true pos, where arrows launch from, is unchanged)
        for (let i = 0; i < this.garrison.length; i++) {
            const g = this.garrison[i];
            g.a.pos.y -= this.size * 0.18;
            g.a.show(tranparency);
            g.a.pos.y += this.size * 0.18;
        }

        // health bar
        if (healthBars) {
            const pct = constrain(this.hitpoints / this.maxHitpoints, 0, 1);
            const w = this.size * 0.9, h = max(3, this.size * 0.12);
            const x = this.pos.x - w / 2, y = this.pos.y - this.size * 0.75;
            noStroke(); fill(30, 160); rect(x, y, w, h, h / 2);
            fill(lerpColor(color(255, 60, 60), color(80, 220, 120), pct));
            rect(x, y, w * pct, h, h / 2);
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
                text: `-${dmg | 0}`
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
