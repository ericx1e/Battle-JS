function Soldier(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'soldier'
        this.team = team
        this.cost = BALANCE.soldier.cost
        this.vel = createVector(0, 0)
        this.size = width / 100
        this.speed = this.size / 10;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = BALANCE.soldier.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.soldier.atk
        this.attackSpeed = BALANCE.soldier.period //number of frames between attacks
        this.attackRange = this.size * 1.5
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.attackRotate = 0

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
        // the cut: wind back, whip through, follow through — with a body
        // lunge into the blow and a streak along the carved arc
        const swingPeak = PI / 3
        const swordRest = this.swordRest !== undefined ? this.swordRest : PI / 4 // guard pose knob
        let swingRot = 0
        if (this._swingT !== undefined) {
            swingRot = swingCurve(this._swingT, swingPeak, 3, 2, 10)
            const pastImpact = this._swingT >= 5
            if (++this._swingT > 15) this._swingT = undefined
            translate(this.size * 0.15 * swingRot / swingPeak, 0)
            if (pastImpact) drawSwingStreak(this.size, swingRot, swingPeak, this.size * 0.95, swordRest - HALF_PI)
        }
        rotate(swingRot)
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)

        drawSettings(team, tranparency, this.size)
        let s = this.size / 4
        push()
        translate(this.size / 2, 0)
        rotate(swordRest)
        noFill()
        line(0, s, 0, -3 * s)
        line(-s / 3, 0, s / 3, 0)
        // beginShape()
        // vertex(0, s)
        // vertex(-s / 2, 0)
        // vertex(0, -3 * s)
        // vertex(s / 2, 0)
        // vertex(0, s)
        // endShape()
        pop()

        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }
        // text(this.firstAttackFrame, 0, 0)

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

        moveUnit(this)
        if (distSquared(this.pos, this.target.pos) < sqr(this.attackRange + reachBonus(this.target))) {
            if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack();
            }
            // this.checkCollision(allies.concat(foes))
        }

        // a swing begun earlier LANDS now, as the blade comes through — the
        // target can die or slip away during the wind-up, and so can we
        if (this._strikeFrame !== undefined && battleFrameCount >= this._strikeFrame) {
            this._strikeFrame = undefined
            const t = this._strikeTarget
            if (t && !t.isDead && distSquared(this.pos, t.pos) < sqr((this.attackRange + reachBonus(t)) * 1.3)) {
                takeDamage(t, this.attackPower, this)
            }
        }

        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    this.attack = function () {
        this._swingT = 0 // kick off the wind-up/snap/recover swing (see swingCurve)
        this._strikeFrame = battleFrameCount + 5 // damage lands at the swing's impact, not the wind-up
        this._strikeTarget = this.target
    }
}