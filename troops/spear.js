function Spear(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'spear'
        this.team = team
        this.cost = BALANCE.spear.cost
        this.projectiles = team == 'red' ? redProjectiles : blueProjectiles

        this.vel = createVector(0, 0)
        this.size = width / 100
        this.speed = this.size / 30;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = BALANCE.spear.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.spear.atk
        this.attackSpeed = BALANCE.spear.period //number of frames between attacks
        this.rangedAttackSpeed = 90 //number of frames between attacks
        this.attackRange = this.size * 3
        this.rangedAttackRange = this.size * 30
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))
        this.firstRangedAttackFrame = parseInt(random(0, this.rangedAttackSpeed))
        this.charges = 3
        this._rearm = 0 // frames spent disengaged, recovering javelins

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
        this.drawSpear(this.size / 5, this.size / 5, team, tranparency)

        for (let i = 0; i < this.charges; i++) {
            push()
            translate(-this.size / 2, this.size / 3)
            rotate(-PI / 1.7 + PI / 60 * i)
            this.drawSpear(0, i / 1.7, team, tranparency)
            pop()
        }

        // sphere(this.size / 2)
        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }

        pop()
    }

    this.drawSpear = function (x, y, team, tranparency) {
        push()
        translate(x, y)
        drawSettings(team, tranparency, this.size)
        push()
        translate(this.size * 1.2, 0)
        line(-this.size * 1.5, 0, 0, 0)
        noFill()
        let tipS = this.size / 6
        beginShape()
        vertex(0, tipS / 2)
        vertex(tipS, tipS / 2 * 3 / 4)
        vertex(3 * tipS, 0)
        vertex(tipS, -tipS / 2 * 3 / 4)
        vertex(0, -tipS / 2)
        vertex(0, tipS / 2)
        endShape()
        pop()
        pop()
    }

    this.update = function (allies, foes) {
        if (this.isDead) return

        // skirmish rhythm: javelins are recovered while disengaged (1 per 3s,
        // max 3) — the volley is a cycle, not a one-time alpha strike
        if (this.charges < 3) {
            const disengaged = this.target === this || this.target.isDead ||
                distSquared(this.pos, this.target.pos) > sqr(this.rangedAttackRange * 0.5)
            if (disengaged) {
                if (++this._rearm >= 180) { this._rearm = 0; this.charges++ }
            } else {
                this._rearm = 0
            }
        }

        if (foes.length == 0) {
            this.target = this
            return
        }

        if (this.speed < this.maxSpeed) {
            this.speed += this.maxSpeed / 100
        }

        updateTarget(this, foes)

        moveUnit(this)
        if (distSquared(this.pos, this.target.pos) < sqr(this.attackRange + reachBonus(this.target))) {
            if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack();
            }
            // this.checkCollision(allies.concat(foes))
        }
        if (this.charges > 0 && distSquared(this.pos, this.target.pos) < sqr(this.rangedAttackRange + reachBonus(this.target))) {
            if ((battleFrameCount - this.firstRangedAttackFrame) % this.rangedAttackSpeed == 0) {
                this.rangedAttack();
                this.charges--
            }
        }


        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    this.attack = function () {
        takeDamage(this.target, this.attackPower, this)
        knockbackUnit(this.target, this.pos, 0.3) // the poke keeps foes at spear's length
    }

    this.rangedAttack = function () {
        let spear = new ThrownSpear(this.pos, this.target.pos, team)
        spear.damage *= this.dmgMult || 1
        this.projectiles.push(spear)
    }
}