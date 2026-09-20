function Keep(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'keep'
        this.team = team
        this.cost = BALANCE.keep.cost
        this.allies = team == 'red' ? redTroops : blueTroops
        this.vel = createVector(0, 0)
        this.size = height / 5.5
        this.speed = 0
        this.maxSpeed = 0
        this.target = this
        this.maxHitpoints = BALANCE.keep.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = 0
        this.attackSpeed = 1000
        this.attackRange = 0
        this.firstAttackFrame = 0

        this.takingDamageFrames = 0 //animation for getting hit

        this.isDead = false
    }

    this.reset()

    this.show = function (tranparency) {
        push()
        translate(this.pos.x, this.pos.y)
        rectMode(CENTER)

        const pct = constrain(this.hitpoints / this.maxHitpoints, 0, 1)
        const red = this.team == 'red'
        const a = tranparency || 255
        const lift = this.size * 0.13 // the keep TOWERS: its roof rides high above the footprint

        // shadow pooled at the base
        noStroke()
        fill(0, 90 * a / 255)
        rect(0, lift * 0.6, this.size * 0.9, this.size * 0.86, this.size * 0.06)

        // stone FACE from the ground up to the roofline
        strokeWeight(this.size / 40)
        if (red) {
            stroke(190, 110, 110, a)
            fill(140, 62, 62, (70 + 90 * pct) * a / 255)
        } else {
            stroke(110, 110, 190, a)
            fill(62, 62, 140, (70 + 90 * pct) * a / 255)
        }
        rect(0, 0, this.size * 0.8, this.size * 0.8, this.size * 0.06)

        // the rooftop, standing proud of the field
        push()
        translate(0, -lift)
        // opaque slab first — the stone face below must not bleed through
        noStroke()
        fill(39)
        rect(0, 0, this.size * 0.8, this.size * 0.8, this.size * 0.06)
        strokeWeight(this.size / 40)
        if (red) {
            stroke(255, 150, 150, a)
            fill(255, 120, 120, (40 + 110 * pct) * a / 255)
        } else {
            stroke(150, 150, 255, a)
            fill(120, 120, 255, (40 + 110 * pct) * a / 255)
        }
        rect(0, 0, this.size * 0.8, this.size * 0.8, this.size * 0.06)
        // inner keep
        rect(0, this.size * 0.08, this.size * 0.45, this.size * 0.45, this.size * 0.04)

        // banner
        line(0, -this.size * 0.15, 0, -this.size * 0.62)
        noFill()
        beginShape()
        vertex(0, -this.size * 0.62)
        vertex(this.size * 0.18, -this.size * 0.55)
        vertex(0, -this.size * 0.48)
        endShape()

        // hit flash
        if (this.takingDamageFrames > 0) {
            noStroke()
            fill(255, map(this.takingDamageFrames, 0, 10, 0, 90))
            rect(0, 0, this.size * 0.8, this.size * 0.8, this.size * 0.06)
            this.takingDamageFrames--
        }
        pop()

        pop()
    }

    this.update = function (allies, foes) {
        if (this.isDead) return
        if (this.hitpoints <= 0) {
            this.isDead = true
            return
        }

        // the keep MUSTERS: a slow trickle of soldiers from the gate, capped
        // at a small standing garrison — reinforcement, not an army printer
        if (battleFrameCount % BALANCE.keep.spawnPeriod == 0) {
            let born = 0
            for (let i = 0; i < this.allies.length; i++) {
                const a = this.allies[i]
                if (a && !a.isDead && a._keepBorn) born++
            }
            if (born < BALANCE.keep.spawnCap) {
                // out the gate, toward the nearest threat (or the field if quiet)
                let dx = width / 2 - this.pos.x, dy = height / 2 - this.pos.y
                let best = Infinity
                for (let i = 0; i < (foes ? foes.length : 0); i++) {
                    const f = foes[i]
                    if (!f || f.isDead) continue
                    const d2 = distSquared(this.pos, f.pos)
                    if (d2 < best) { best = d2; dx = f.pos.x - this.pos.x; dy = f.pos.y - this.pos.y }
                }
                const m = Math.max(1e-6, Math.hypot(dx, dy))
                const gx = this.pos.x + dx / m * this.size * 0.62 + random(-this.size * 0.1, this.size * 0.1)
                const gy = this.pos.y + dy / m * this.size * 0.62 + random(-this.size * 0.1, this.size * 0.1)
                const s = makeTroop('soldier', gx, gy, this.team)
                s._keepBorn = true
                this.allies.push(s)
                spawnRing(gx, gy, this.team, this.size * 0.3)
            }
        }
    }
}
