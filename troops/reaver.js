// Reaver — the disruptor. Doesn't grind forward with the line: once a soft
// priority target (archer, wizard, summoner — anything ranged or support)
// sits within leaping range, it soars clean OVER the front rank and crashes
// down on it, scattering everyone near the landing point. It then fights as
// ordinary — and fairly fragile — melee from wherever it lands, often alone
// deep in enemy lines. The payoff is reach; the cost is what happens next.

// priority target scan: hunts ranged/support foes specifically, sticking
// with one once locked on so it doesn't thrash between targets mid-approach.
// falls back to normal closest-foe targeting when nothing soft is in range.
function reaverPickTarget(unit, foes) {
    if (unit.target && unit.target !== unit && !unit.target.isDead) {
        const cur = BALANCE[unit.target.name]
        if (cur && (cur.rangeMult >= 1.5 || cur.atk == 0)) return // already hunting — stick with it
    }
    // field-relative, not body-relative: it needs to spot a backline target
    // from clear across the front line, long before it's close enough to leap
    const huntR2 = sqr(width * 0.5)
    let best = null, bestD2 = Infinity
    for (let i = 0; i < foes.length; i++) {
        const f = foes[i]
        if (!f || f.isDead) continue
        const b = BALANCE[f.name]
        if (!b || (b.rangeMult < 1.5 && b.atk > 0)) continue // not soft/priority
        const d2 = distSquared(unit.pos, f.pos)
        if (d2 < huntR2 && d2 < bestD2) { bestD2 = d2; best = f }
    }
    if (best) { unit.target = best; return }
    updateTarget(unit, foes)
}

function Reaver(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'reaver'
        this.team = team
        this.cost = BALANCE.reaver.cost
        this.vel = createVector(0, 0)
        this.size = width / 105
        this.speed = this.size / 11 // slower than a soldier on foot — retreat is a gamble, not a guaranteed escape; its speed is spent on the LEAP
        this.maxSpeed = this.speed
        this.target = this
        this.maxHitpoints = BALANCE.reaver.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.reaver.atk
        this.attackSpeed = BALANCE.reaver.period
        this.attackRange = this.size * 1.5
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        // the LEAP: available once a target sits beyond melee but within
        // hunting range, gated by a cooldown so it can't chain-teleport
        this.leapMinRange = this.attackRange * 3.5
        this.leapRange = width * 0.2 // covers a formation's depth — the last stretch, not the whole field
        this.impactRange = this.size * 3.2
        this.threatRadius = this.attackRange * 4 // how far it looks to judge "am I surrounded"
        this.threatCount = 3 // this many nearby foes and it turns to run instead of standing
        this._leapCooldown = 0
        this._leaping = 0
        this._leapTotal = 16
        this._leapFrom = null
        this._leapTo = null
        this._hasLanded = false // retreat behavior only makes sense once it's actually dived in

        this.attackRotate = 0
        this._swingT = undefined
        this._strikeFrame = undefined
        this._strikeTarget = null

        this.takingDamageFrames = 0

        this.isDead = false
    }

    this.reset()

    this.show = function (tranparency) {
        push()
        translate(this.pos.x, this.pos.y)
        if (this._shadowFrame != frameCount) drawUnitShadow(this.size) // feet on the field (battle runs a shadow pass first)

        // extra lift while airborne, on top of the normal standing lift —
        // a proper arc over the collision plane, with a streak marking the path
        let airLift = 0
        if (this._leaping > 0) {
            const s = 1 - this._leaping / this._leapTotal
            airLift = this.size * 2.2 * 4 * s * (1 - s)
            if (team == 'red') stroke(255, 150, 150, 130 * (1 - s))
            else stroke(150, 150, 255, 130 * (1 - s))
            strokeWeight(this.size / 6)
            line(this._leapFrom.x - this.pos.x, this._leapFrom.y - this.pos.y, 0, 0)
        }
        translate(0, -bodyLift(this.size) - airLift)

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

        // the cut: same wind-up/snap/recover swing as the soldier, on a
        // lighter blade — the swing juice is shared, the silhouette isn't
        const swingPeak = PI / 3
        const swordRest = this.swordRest !== undefined ? this.swordRest : radians(90 - 30)
        let swingRot = 0
        if (this._swingT !== undefined) {
            swingRot = swingCurve(this._swingT, swingPeak, 3, 2, 9)
            const pastImpact = this._swingT >= 5
            if (++this._swingT > 14) this._swingT = undefined
            translate(this.size * 0.14 * swingRot / swingPeak, 0)
            if (pastImpact) drawSwingStreak(this.size, swingRot, swingPeak, this.size * 0.85, swordRest - HALF_PI)
        }
        rotate(swingRot)

        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)

        // a hood/collar sweeping back — a raider's silhouette, not a soldier's
        drawSettings(team, tranparency, this.size)
        noFill()
        strokeWeight(this.size / 10)
        arc(-this.size * 0.05, 0, this.size * 1.15, this.size * 1.15, PI * 0.55, PI * 1.45)

        // the blade: held low, aimed with facing (screen-anchored then rotated)
        push()
        translate(0, this.size * 0.26)
        rotate(unitFacing(this))
        rotate(swingRot)
        drawSettings(team, tranparency, this.size)
        push()
        translate(this.size * 0.4, 0)
        rotate(swordRest)
        noFill()
        strokeWeight(this.size / 9)
        beginShape()
        vertex(0, this.size * 0.12)
        vertex(this.size * 0.55, -this.size * 0.05)
        vertex(this.size * 0.85, -this.size * 0.32)
        endShape()
        pop()
        pop()

        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }

        pop()
    }

    this.update = function (allies, foes) {
        if (this.isDead) return
        if (this.hitpoints <= 0) {
            this.isDead = true
            return
        }

        if (this._leapCooldown > 0) this._leapCooldown--

        // airborne: interpolate straight to the landing point, ignoring
        // normal movement/collision (isImmovable covers being shoved), then
        // crash down on arrival
        if (this._leaping > 0) {
            const s = 1 - (this._leaping - 1) / this._leapTotal
            this.pos.x = this._leapFrom.x + (this._leapTo.x - this._leapFrom.x) * s
            this.pos.y = this._leapFrom.y + (this._leapTo.y - this._leapFrom.y) * s
            this._leaping--
            if (this._leaping <= 0) {
                this.pos.x = this._leapTo.x
                this.pos.y = this._leapTo.y
                this.landImpact()
            }
            return
        }

        if (foes.length == 0) {
            this.target = this
            return
        }

        if (this.speed < this.maxSpeed) {
            this.speed += this.maxSpeed / 100
        }

        reaverPickTarget(this, foes)

        // it's a raider, not a duelist: once it's actually swarmed AFTER
        // diving in, it disengages rather than making a last stand — but
        // this can only trigger post-landing. before its first leap it has
        // to approach like everything else; checking threats during the
        // normal walk-up made it retreat the instant it touched the front
        // line (any real battle is denser than open ground), backpedaling
        // forever without ever getting close enough to leap.
        const foeTeam = team == 'red' ? 'blue' : 'red'
        const threats = this._hasLanded ? checkTeamCollision(this.pos, this.threatRadius, foeTeam) : []
        if (threats.length >= this.threatCount) {
            let nearest = threats[0], bestD2 = Infinity
            for (let i = 0; i < threats.length; i++) {
                const d2 = distSquared(this.pos, threats[i].pos)
                if (d2 < bestD2) { bestD2 = d2; nearest = threats[i] }
            }
            this.vel.set(this.pos.x - nearest.pos.x, this.pos.y - nearest.pos.y).limit(this.speed)
            this.pos.add(this.vel)
            checkUnitCollision(this)
            checkBoundaries(this)
        } else {
            const d2 = distSquared(this.pos, this.target.pos)
            if (this._leapCooldown <= 0 && d2 > sqr(this.leapMinRange) && d2 < sqr(this.leapRange)) {
                this.startLeap(this.target.pos)
                return
            }

            moveUnit(this)
            if (d2 < sqr(this.attackRange + reachBonus(this.target))) {
                if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                    this.attack()
                }
            }
        }

        // a swing begun earlier LANDS now, as the blade comes through —
        // even mid-retreat, a strike already thrown still connects
        if (this._strikeFrame !== undefined && battleFrameCount >= this._strikeFrame) {
            this._strikeFrame = undefined
            const t = this._strikeTarget
            if (t && !t.isDead && distSquared(this.pos, t.pos) < sqr((this.attackRange + reachBonus(t)) * 1.3)) {
                takeDamage(t, this.attackPower, this)
            }
        }
    }

    this.startLeap = function (targetPos) {
        this._leapFrom = { x: this.pos.x, y: this.pos.y }
        const ang = atan2(targetPos.y - this.pos.y, targetPos.x - this.pos.x)
        const landDist = max(this.size, dist(this.pos.x, this.pos.y, targetPos.x, targetPos.y) - this.size * 1.1)
        this._leapTo = {
            x: this.pos.x + cos(ang) * landDist,
            y: this.pos.y + sin(ang) * landDist,
        }
        this._leaping = this._leapTotal
        this._leapCooldown = BALANCE.reaver.cooldownFrames
    }

    // the crash: everyone caught near the landing point is struck and
    // scattered — a burst, not a duel; no follow-through (it would double-dip)
    this.landImpact = function () {
        this._hasLanded = true // past this point, it's alone in enemy lines — retreat logic switches on
        const foeTeam = team == 'red' ? 'blue' : 'red'
        const hit = checkTeamCollision(this.pos, this.impactRange, foeTeam).slice()
        for (let i = 0; i < hit.length; i++) {
            const f = hit[i]
            if (!f || f.isDead) continue
            takeDamage(f, this.attackPower * BALANCE.reaver.impactMult, this, true)
            knockbackUnit(f, this.pos, 1.2)
        }
        spawnRing(this.pos.x, this.pos.y, team, this.impactRange)
    }

    this.attack = function () {
        this._swingT = 0 // kick off the wind-up/snap/recover swing (see swingCurve)
        this._strikeFrame = battleFrameCount + 5 // damage lands at the swing's impact, not the wind-up
        this._strikeTarget = this.target
    }
}
