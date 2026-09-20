// Charger — light cavalry. Fast enough to reach the backline, and the first
// strike after a full gallop lands double-hard and staggers the target.
// After the impact it fights like an ordinary (slightly beefy) melee troop,
// so the payoff is in WHERE it hits, not attrition.

function Charger(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'charger'
        this.team = team
        this.cost = BALANCE.charger.cost
        this.vel = createVector(0, 0)
        this.size = width / 100
        this.speed = this.size / 6 // notably faster than the footmen
        this.maxSpeed = this.speed
        this.target = this
        this.maxHitpoints = BALANCE.charger.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.charger.atk
        this.attackSpeed = BALANCE.charger.period //number of frames between attacks
        this.attackRange = this.size * 1.5
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.gallop = 0 // builds in the open, spent on the impact strike
        this._thrust = 0 // lance jab animation frames

        this.takingDamageFrames = 0 //animation for getting hit

        this.isDead = false
    }

    this.reset()

    this.show = function (tranparency) {
        // gallop ribbon: the charge carves a fading trail along its true path —
        // the same visual language as swing streaks and arrow trails
        if (this.gallop >= 40) {
            this._trailPts = this._trailPts || []
            const last = this._trailPts[this._trailPts.length - 1]
            const y = this.pos.y - bodyLift(this.size)
            if (!last || (last.x - this.pos.x) * (last.x - this.pos.x) + (last.y - y) * (last.y - y) > sqr(this.size * 0.25)) {
                this._trailPts.push({ x: this.pos.x, y: y })
            }
        } else if (this._trailPts && this._trailPts.length) {
            this._trailPts.shift(); this._trailPts.shift() // the ribbon dissolves once the charge is spent
        }
        if (this._trailPts && this._trailPts.length > 12) this._trailPts.shift()
        if (this._trailPts) {
            for (let i = 1; i < this._trailPts.length; i++) {
                const k = i / this._trailPts.length
                if (team == 'red') stroke(255, 150, 150, 120 * k)
                else stroke(150, 150, 255, 120 * k)
                strokeWeight(this.size / 3 * k)
                line(this._trailPts[i - 1].x, this._trailPts[i - 1].y, this._trailPts[i].x, this._trailPts[i].y)
            }
        }

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
        const facing = unitFacing(this)
        const shrink = this.size * this.takingDamageFrames / 100
        // at full gallop the whole horse SURGES in rhythm
        if (this.gallop >= 40) {
            translate(0, sin(frameCount * 0.55) * this.size * 0.07)
        }

        // the mount turns with the charge: long outlined body, neck and head
        // leading straight down the axis (offsets off the axis would flip
        // below the body when facing west)
        push()
        rotate(facing)
        drawSettings(team, tranparency, this.size)
        ellipse(0, 0, this.size * 1.35 - shrink, this.size * 0.72 - shrink)
        ellipse(this.size * 0.62, 0, this.size * 0.5, this.size * 0.3)
        ellipse(this.size * 0.95, 0, this.size * 0.3, this.size * 0.24)
        pop()

        // the rider sits high and distinct on the mount's back
        push()
        translate(0, -this.size * 0.45)
        rotate(facing)
        drawSettings(team, tranparency, this.size)
        ellipse(-this.size * 0.12, 0, this.size * 0.34, this.size * 0.34)
        pop()

        // the lance: couched level at the rider's hand, jabbing on a strike,
        // extended while the charge is primed, pennant snapping at the head
        let jab = 0
        if (this._thrust > 0) {
            jab = this.size / 3 * this._thrust / 8
            this._thrust--
        }
        push()
        translate(0, -this.size * 0.08)
        rotate(facing)
        drawSettings(team, tranparency, this.size)
        noFill()
        strokeWeight(this.size / 8)
        const reach = this.size * (this.gallop >= 40 ? 1.7 : 1.3) + jab
        line(-this.size / 4 + jab, this.size / 7, reach, this.size / 7)
        noStroke()
        triangle(reach - this.size * 0.34, this.size / 7 - this.size * 0.03,
            reach - this.size * 0.34, this.size / 7 - this.size * 0.26,
            reach - this.size * 0.04, this.size / 7 - this.size * 0.07)
        pop()

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

        moveUnit(this)
        const d2 = distSquared(this.pos, this.target.pos)
        const reach = reachBonus(this.target) // structures are struck at their edge
        if (d2 > sqr(this.attackRange * 2 + reach)) {
            this.gallop = min(this.gallop + 1, 60) // room to run — momentum builds
        } else if (d2 < sqr(this.attackRange + reach)) {
            if (this.gallop >= 40) {
                this.attack(true) // the lance lands the moment contact is made
                this.firstAttackFrame = battleFrameCount // regular swings resume a full period later
                // a killing impact doesn't slow the horse: the charge ROLLS ON
                // into the next victim. only a survivor bogs the charger down.
                this.gallop = (this.target.hitpoints <= 0) ? 60 : 0
            } else if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack(false)
                this.gallop = 0 // stuck in the press
            }
        }

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }

    this.attack = function (impact) {
        this._thrust = 8 // lance jabs forward
        const t = this.target
        if (impact) {
            // the impact: a massive single-target lance hit. overkill spills
            // into the next enemy in reach via melee follow-through.
            takeDamage(t, this.attackPower * BALANCE.charger.impactMult, this)
            spawnRing(this.pos.x, this.pos.y, team, this.size * 1.5)
            knockbackUnit(t, this.pos, 1.5)
        } else {
            takeDamage(t, this.attackPower, this)
        }
    }
}
