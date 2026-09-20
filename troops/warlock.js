// Warlock — a battle mage, a capstone anchor rather than a swarm piece.
// Every other troop has a clear physical verb with a windup and a payoff:
// the knight winds up and crushes, the charger builds speed and slams, the
// wizards throw something that travels and bursts. This is the warlock's:
// chains lash out on a real cast rhythm — windup, release, impact — yanking
// victims in hard and rooting them for a beat, not an ambient background
// tick. Every few casts, one is supercharged into a bigger, wider eruption.
function Warlock(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'warlock'
        this.team = team
        this.cost = BALANCE.warlock.cost

        this.vel = createVector(0, 0)
        this.size = width / 75 // a big, imposing frame
        this.speed = this.size / 13
        this.maxSpeed = this.speed
        this.target = this
        this.maxHitpoints = BALANCE.warlock.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.warlock.atk
        this.attackSpeed = BALANCE.warlock.period
        this.attackRange = this.size * 3.6
        this.armor = BALANCE.warlock.armor
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.castCount = 0 // every BALANCE.warlock.empoweredEvery-th cast is supercharged
        this._castT = undefined     // drives the windup/release animation (see swingCurve-style timing)
        this._castTargets = []      // { unit, hitAt } snapshot at release time, for the travel/impact visual
        this._empowered = false
        this._rooted = []           // { unit, until } — re-enforced every frame this update() runs; a root that
                                     // only set speed=0 ONCE would be undone next frame by the target's own
                                     // per-frame speed ramp-up before anything re-applied it

        this.takingDamageFrames = 0
        this.isDead = false
    }

    this.reset()

    this.show = function (tranparency) {
        const windup = this._castT !== undefined && this._castT < BALANCE.warlock.castWindup
        const releasing = this._castT !== undefined && this._castT >= BALANCE.warlock.castWindup

        // the chains: drawn in WORLD space, before any local transform below.
        // during the windup they gather as a coiled glow at the mage; on
        // release they snap out toward each target over castTravel frames —
        // a real traveling strike, not an instant tether appearing from nowhere
        if (releasing) {
            const age = this._castT - BALANCE.warlock.castWindup
            const s = min(1, age / BALANCE.warlock.castTravel)
            drawSettings(team, tranparency, this.size)
            stroke(this._empowered ? 255 : 190, this._empowered ? 210 : 110, 255, 210)
            strokeWeight(this.size * (this._empowered ? 0.1 : 0.07))
            for (let i = 0; i < this._castTargets.length; i++) {
                const c = this._castTargets[i]
                if (!c.unit || c.unit.isDead) continue
                line(this.pos.x, this.pos.y, this.pos.x + (c.unit.pos.x - this.pos.x) * s, this.pos.y + (c.unit.pos.y - this.pos.y) * s)
            }
        }

        push()
        translate(this.pos.x, this.pos.y)
        if (this._shadowFrame != frameCount) drawUnitShadow(this.size)
        translate(0, -bodyLift(this.size))

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

        // a heavy, wide hood
        drawSettings(team, tranparency, this.size)
        beginShape()
        vertex(-this.size * 0.15, -this.size * 0.6)
        vertex(this.size * 0.4, -this.size * 0.08)
        vertex(-this.size * 0.45, -this.size * 0.18)
        endShape(CLOSE)

        // the cast gesture: hands/core draw inward and build during the
        // windup (anticipation), then flare outward wide open on release
        // (the payoff) — a real casting motion, not a static glow
        let coreDist = this.size * 0.5
        let coreSize = this.size * 0.4
        if (windup) {
            const t = this._castT / BALANCE.warlock.castWindup // 0..1
            coreDist = this.size * (0.5 - 0.28 * t) // draws IN toward the chest
            coreSize = this.size * (0.4 + 0.22 * t) // and swells, charging up
        } else if (releasing) {
            const t = min(1, (this._castT - BALANCE.warlock.castWindup) / 6)
            coreDist = this.size * (0.22 + 0.35 * t) // snaps back OUT on release
            coreSize = this.size * (0.62 - 0.22 * t)
        }
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(coreDist, 0, coreSize * (this._empowered ? 1.3 : 1))
        fill(this._empowered ? 255 : 210, this._empowered ? 235 : 170, 255, 235)
        ellipse(coreDist, 0, coreSize * 0.42 * (this._empowered ? 1.3 : 1))

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

        if (foes.length == 0) {
            this.target = this
            return
        }

        if (this.speed < this.maxSpeed) {
            this.speed += this.maxSpeed / 100
        }

        updateTarget(this, foes)
        moveUnit(this) // no kiting, no retreat — it stands and casts in the thick of it

        // re-enforce the root every frame it's active — a rooted target's own
        // update() ramps its speed back up every frame regardless, so the
        // hold has to win every frame or it silently expires after one
        for (let i = this._rooted.length - 1; i >= 0; i--) {
            const r = this._rooted[i]
            if (!r.unit || r.unit.isDead || battleFrameCount >= r.until) {
                this._rooted.splice(i, 1)
                continue
            }
            r.unit.speed = 0
            r.unit.vel.set(0, 0)
        }

        if (distSquared(this.pos, this.target.pos) < sqr(this.attackRange + reachBonus(this.target))) {
            if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack()
            }
        }

        // the cast resolves on its own timer: windup, then release (chains
        // lash out and travel), then impact — damage lands at IMPACT, not
        // at the moment the cast began, same rule as every melee swing here
        if (this._castT !== undefined) {
            this._castT++
            const impactFrame = BALANCE.warlock.castWindup + BALANCE.warlock.castTravel
            if (this._castT === impactFrame) {
                this.resolveCast()
            } else if (this._castT > impactFrame + 10) {
                this._castT = undefined
            }
        }

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }

    // begin the cast: pick who gets caught (nearest few within range), snapshot
    // them, and let show()/update() carry the windup→release→impact beats
    this.attack = function () {
        this.castCount++
        this._empowered = this.castCount % BALANCE.warlock.empoweredEvery === 0

        const range = this.attackRange * (this._empowered ? BALANCE.warlock.empoweredRangeMult : 1)
        const foeTeam = team == 'red' ? 'blue' : 'red'
        const seen = new Set()
        // skip anything too heavy to yank entirely — no point spending one of
        // only 3 cast slots on a target the spell can't even reposition
        const nearby = checkTeamCollision(this.pos, range, foeTeam).slice()
            .filter(f => f && !f.isDead && !isImmovable(f) && !seen.has(f) && seen.add(f))
            .sort((a, b) => distSquared(this.pos, a.pos) - distSquared(this.pos, b.pos))
            .slice(0, BALANCE.warlock.chainCount)

        this._castTargets = nearby.map(u => ({ unit: u }))
        this._castT = 0
    }

    // the payoff: everyone caught takes a real hit, gets yanked in hard, and
    // is rooted for a beat — then the mage heals a lump sum off what it dealt
    this.resolveCast = function () {
        const dmgMult = this._empowered ? BALANCE.warlock.empoweredDamageMult : 1
        let dealt = 0
        for (let i = 0; i < this._castTargets.length; i++) {
            const u = this._castTargets[i].unit
            if (!u || u.isDead) continue
            const before = u.hitpoints
            takeDamage(u, this.attackPower * dmgMult) // magic: no attacker, ignores blocks like every other spell
            dealt += max(0, before - u.hitpoints)

            if (!isImmovable(u)) {
                // a hard, visible snap-pull — not a slow continuous tug —
                // to just outside melee-adjacent, so it reads as a real yank
                const yankTo = this.size * 1.3
                const d = dist(this.pos.x, this.pos.y, u.pos.x, u.pos.y)
                if (d > yankTo) {
                    const k = (d - yankTo) / d
                    u.pos.x += (this.pos.x - u.pos.x) * k
                    u.pos.y += (this.pos.y - u.pos.y) * k
                }
                // a short root — long enough to matter, short enough that it
                // can't lock a target out of ever fighting back (that was a
                // real bug in the last version of this kit)
                this._rooted.push({ unit: u, until: battleFrameCount + BALANCE.warlock.rootFrames })
                u.speed = 0
            }
        }
        if (dealt > 0) heal(this, dealt * BALANCE.warlock.healFraction)
        spawnRing(this.pos.x, this.pos.y, team, this.attackRange * (this._empowered ? BALANCE.warlock.empoweredRangeMult : 0.6))
    }
}
