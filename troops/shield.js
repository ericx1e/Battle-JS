function Shield(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'shield'
        this.team = team
        this.cost = BALANCE.shield.cost
        this.vel = createVector(0, 0)
        this.size = width / 60
        this.speed = this.size / 14; // marches at line pace — a wall that lags can't hold the front
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = BALANCE.shield.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.shield.atk
        this.attackSpeed = BALANCE.shield.period //number of frames between attacks
        this.attackRange = this.size * 1.5
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.armor = BALANCE.shield.armor // flat damage reduction per hit (see damage.js)
        this.blocksProjectiles = true     // frontal arrows/spears bounce off (magic ignores it)
        this.blockMelee = 0.3             // frontal melee damage reduced 30%
        this.blockedFrames = 0            // shield flash on a successful block

        this.takingDamageFrames = 0 //animation for getting hit

        this.isDead = false
    }

    this.reset()

    this.show = function (tranparency) {
        push()
        translate(this.pos.x, this.pos.y)
        if (this._shadowFrame != frameCount) drawUnitShadow(this.size) // feet on the field (battle runs a shadow pass first)
        translate(0, -bodyLift(this.size)) // the body stands above it

        if (healthBars) {
            strokeWeight(this.size / 5)
            stroke(150)
            line(-this.size, -this.size, this.size, -this.size)
            colorMode(HSB, this.maxHitpoints, 255, 255, 255)
            stroke(30 * this.hitpoints / this.maxHitpoints, 255, 255)
            line(-this.size, -this.size, -this.size + 2 * this.size * this.hitpoints / this.maxHitpoints, -this.size)
        }

        drawSettings(team, tranparency, this.size)
        noFill()
        arc(0, 0, this.size, this.size, PI / 2 - PI * this.hitpoints / this.maxHitpoints, PI / 2 + PI * this.hitpoints / this.maxHitpoints, OPEN)
        rotate(unitFacing(this))
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
        drawSettings(team, tranparency, this.size)
        if (this.blockedFrames > 0) {
            // bright flash when something plinks off the shield
            stroke(255, 255 * this.blockedFrames / 8)
            fill(255, 150 * this.blockedFrames / 8)
            this.blockedFrames--
        }
        // the bash: the whole shield rams forward and recovers
        if (this.bashFrames > 0) {
            translate(this.size * 0.28 * this.bashFrames / 6, 0)
            this.bashFrames--
        }
        beginShape();
        vertex(this.size / 4, -this.size / 2.5);
        vertex((this.size / 1.5 + this.size / 4) / 2, -this.size / 2.1);
        vertex(this.size / 1.5, -this.size / 2.5);
        vertex(this.size / 1.5, this.size / 2.5);
        vertex((this.size / 1.5 + this.size / 4) / 2, this.size / 2.1);
        vertex(this.size / 4, this.size / 2.5);
        vertex(this.size / 4, -this.size / 2.5);
        endShape();
        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }

        pop()
    }

    this.update = function (allies, foes) {
        if (this.isDead) return

        if (foes.length == 0) {
            this.target = this
            return
        }

        if (this.speed < this.maxSpeed) {
            this.speed += this.maxSpeed / 100
        }

        updateTarget(this, foes)

        // the shield FRONTLINES: it advances with the army, and holds exactly
        // while foes are at the shield (bash reach) — it fights the press in
        // front of it instead of wandering after one shoved target.
        const pressing = checkTeamCollision(this.pos, this.attackRange * 1.2, team == 'red' ? 'blue' : 'red')
        if (pressing.length) {
            if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack(pressing.slice()) // copy: takeDamage reuses the collision buffer
            }
            checkUnitCollision(this)
            checkBoundaries(this)
        } else {
            moveUnit(this)
        }

        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    // shield bash sweeps the frontal arc: everyone actually PRESSING the
    // shield gets struck and shoved back (up to 3 — it's a wall, not a whirlwind)
    this.attack = function (pressing) {
        this.bashFrames = 6
        const facing = unitFacing(this)
        let hit = 0
        for (let i = 0; i < pressing.length && hit < 3; i++) {
            const f = pressing[i]
            if (!f || f.isDead) continue
            const ang = atan2(f.pos.y - this.pos.y, f.pos.x - this.pos.x)
            let d = abs(ang - facing) % TWO_PI
            if (d > PI) d = TWO_PI - d
            if (d > PI * 0.45) continue // behind the shield — no bash without facing
            takeDamage(f, this.attackPower, this, true) // a sweep: no follow-through
            knockbackUnit(f, this.pos, 0.5) // firm shove, not a launch — attackers still get their swings
            hit++
        }
    }
}