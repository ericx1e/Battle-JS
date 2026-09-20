// Knight — the plate anvil. Shield blocks arrows from the front, phalanx
// braces melee from the front; the knight's armor works from EVERY direction.
// Flat reduction makes chaff hit for scraps (min 1), so swarms can barely
// scratch it — while heavy single blows (charger impact, chain lightning,
// reaper) punch straight through the plate. Durability without healing.

function Knight(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'knight'
        this.team = team
        this.cost = BALANCE.knight.cost
        this.vel = createVector(0, 0)
        this.size = width / 75 // a big armored frame — reads heavier than the footmen
        this.speed = this.size / 15; // plate is heavy — it marches, it never runs
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = BALANCE.knight.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.knight.atk
        this.attackSpeed = BALANCE.knight.period //number of frames between attacks
        this.attackRange = this.size * 1.6
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.armor = BALANCE.knight.armor // full plate: flat damage reduction per hit (see damage.js)

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
        const facing = unitFacing(this)
        // the greatsword blow: a long wind-up, a crushing fall, a slow
        // recovery — and the whole knight leans back then steps THROUGH it
        const swingPeak = PI * 0.7
        let swingRot = 0
        let pastImpact = false
        if (this._swingT !== undefined) {
            swingRot = swingCurve(this._swingT, swingPeak, 7, 3, 18)
            pastImpact = this._swingT >= 10
            if (++this._swingT > 28) this._swingT = undefined
        }
        // lunge toward the foe, in screen space
        const lunge = this.size * 0.18 * swingRot / swingPeak
        translate(cos(facing) * lunge, sin(facing) * lunge)

        // torso
        const shrink = this.size * this.takingDamageFrames / 100
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - shrink, this.size - shrink)

        // worn plate turns with the man — gear always points where he faces
        push()
        rotate(facing)
        // pauldrons: heavy plates over each shoulder
        drawSettings(team, tranparency, this.size)
        ellipse(-this.size * 0.1, -this.size * 0.42, this.size * 0.42, this.size * 0.42)
        ellipse(-this.size * 0.1, this.size * 0.42, this.size * 0.42, this.size * 0.42)
        // breastplate: a chevron across the chest, pointing where he faces
        drawSettings(team, tranparency, this.size)
        noFill()
        strokeWeight(this.size / 12)
        beginShape()
        vertex(this.size * 0.05, -this.size * 0.3)
        vertex(this.size * 0.32, 0)
        vertex(this.size * 0.05, this.size * 0.3)
        endShape()
        // the great helm: a solid dome with a visor slit toward the foe
        drawSettings(team, tranparency, this.size)
        ellipse(this.size * 0.05, 0, this.size * 0.55, this.size * 0.55)
        strokeWeight(this.size / 14)
        line(this.size * 0.28, -this.size * 0.13, this.size * 0.28, this.size * 0.13) // visor slit
        line(this.size * 0.05, -this.size * 0.27, -this.size * 0.28, 0) // crest sweeping back
        line(this.size * 0.05, this.size * 0.27, -this.size * 0.28, 0)
        pop()

        // the GREATSWORD is HELD: its frame drops toward the ground plane
        // BEFORE the facing rotation, so it rides at hand height instead of
        // floating at the helm
        const swordRest = this.swordRest !== undefined ? this.swordRest : radians(90 - 65) // guard pose knob: blade −65°, carried high over the shoulder
        push()
        translate(0, this.size * 0.28)
        rotate(facing)
        if (pastImpact) drawSwingStreak(this.size, swingRot, swingPeak, this.size * 1.25, swordRest - HALF_PI)
        rotate(swingRot)
        drawSettings(team, tranparency, this.size)
        push()
        translate(this.size * 0.45, this.size * 0.2) // gripped at the sword-side hand
        // guard pose (swordRest): keep the blade radially OUT from the body —
        // angled back across the body it would straddle the body-center swing
        // pivot and look like it spins about its middle
        rotate(swordRest)
        // a broad slab of steel, tapering to the point
        strokeWeight(this.size / 18)
        beginShape()
        vertex(-this.size * 0.1, this.size * 0.3)
        vertex(-this.size * 0.1, -this.size * 1.28)
        vertex(0, -this.size * 1.55) // the point
        vertex(this.size * 0.1, -this.size * 1.28)
        vertex(this.size * 0.1, this.size * 0.3)
        endShape(CLOSE)
        line(0, this.size * 0.1, 0, -this.size * 1.2)            // the fuller
        noFill()
        strokeWeight(this.size / 14)
        line(-this.size * 0.3, 0, this.size * 0.3, 0)            // crossguard
        ellipse(0, this.size * 0.4, this.size * 0.16, this.size * 0.16) // pommel
        pop()
        pop() // close the held-low sword frame

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
        if (distSquared(this.pos, this.target.pos) < sqr(this.attackRange + reachBonus(this.target))) {
            if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack();
            }
        }

        // the greatsword FALLS now — the cleave resolves as the blade comes
        // through, against whoever stands in the arc at that moment
        if (this._strikeFrame !== undefined && battleFrameCount >= this._strikeFrame) {
            this._strikeFrame = undefined
            const aim = (this._strikeTarget && !this._strikeTarget.isDead) ? this._strikeTarget : this.target
            if (aim && aim !== this) this.cleave(aim)
        }

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    this.attack = function () {
        this._swingT = 0 // wind-up, crushing fall, slow recovery (see swingCurve)
        this._strikeFrame = battleFrameCount + 10 // the blow lands when the blade comes THROUGH
        this._strikeTarget = this.target
    }

    // the greatsword CLEAVES: everything caught in the swing's frontal arc is
    // struck — up to 3, nearest first. a wide blade, not a duelist's point.
    this.cleave = function (aim) {
        const ang = atan2(aim.pos.y - this.pos.y, aim.pos.x - this.pos.x)
        // shared buffer: drain fully into struck before any takeDamage
        const foes = checkTeamCollision(this.pos, this.attackRange, team == 'red' ? 'blue' : 'red')
        const struck = []
        for (let i = 0; i < foes.length; i++) {
            const f = foes[i]
            if (!f || f.isDead) continue
            let d = abs(atan2(f.pos.y - this.pos.y, f.pos.x - this.pos.x) - ang) % TWO_PI
            if (d > PI) d = TWO_PI - d
            if (d > PI * 0.38) continue // outside the swing's arc
            struck.push(f)
        }
        struck.sort((a, b) => distSquared(this.pos, a.pos) - distSquared(this.pos, b.pos))
        for (let i = 0; i < struck.length && i < 3; i++) {
            takeDamage(struck[i], this.attackPower, this, true) // a cleave: no follow-through
        }
    }
}
