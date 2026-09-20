// Barracks — a player-built, upgradable spawner. The Keep's own garrison is a
// small free trickle (reinforcement, not an army printer); the Barracks is the
// answer to "buying units feels temporary in an endless siege" — gold spent
// here keeps paying off every wave after, instead of evaporating with the
// troops it bought. Not in BALANCE/the shop: it's a siege-meta structure,
// built and upgraded with siege gold via its own HUD button (see siege.js).
// each tier spawns its whole `squad` list at once (as cap allows) — tier 1 is
// a single soldier (same as the Keep's own trickle), tier 2 doubles up into a
// real pair, tier 3 swaps in an anchor duo (archer support + a knight) instead
// of just more chaff — the payoff for a steep upgrade cost is BETTER
// reinforcements, not just faster ones.
const BARRACKS_TIERS = [
    null, // tier 0: not built yet
    { cap: 3, period: 300, cost: 80, squad: ['soldier'] },              // tier 1: build cost
    { cap: 5, period: 260, cost: 120, squad: ['soldier', 'soldier'] },  // tier 2: upgrade cost
    { cap: 7, period: 220, cost: 180, squad: ['archer', 'knight'] },    // tier 3: upgrade cost (max)
]

function Barracks(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'barracks'
        this.team = team
        this.allies = team == 'red' ? redTroops : blueTroops
        this.vel = createVector(0, 0)
        this.size = height / 9
        this.speed = 0
        this.maxSpeed = 0
        this.target = this
        this.maxHitpoints = 900
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = 0
        this.attackSpeed = 1000
        this.attackRange = 0
        this.firstAttackFrame = 0

        this.tier = 1 // built at tier 1 the moment one is constructed (see buildBarracks in siege.js)
        this.cost = BARRACKS_TIERS[1].cost // counts toward armyValue like the Keep does — a real investment raises the stakes too

        this.takingDamageFrames = 0
        this.isDead = false
    }

    this.reset()

    this.upgrade = function () {
        if (this.tier >= BARRACKS_TIERS.length - 1) return false
        this.tier++
        this.cost += BARRACKS_TIERS[this.tier].cost
        return true
    }

    this.show = function (tranparency) {
        push()
        translate(this.pos.x, this.pos.y)
        rectMode(CENTER)

        const pct = constrain(this.hitpoints / this.maxHitpoints, 0, 1)
        const red = this.team == 'red'
        const a = tranparency || 255
        const lift = this.size * 0.16

        noStroke()
        fill(0, 90 * a / 255)
        rect(0, lift * 0.6, this.size * 0.95, this.size * 0.7, this.size * 0.08)

        strokeWeight(this.size / 35)
        if (red) {
            stroke(190, 140, 100, a)
            fill(150, 100, 62, (70 + 90 * pct) * a / 255)
        } else {
            stroke(140, 150, 190, a)
            fill(80, 90, 140, (70 + 90 * pct) * a / 255)
        }
        rect(0, 0, this.size * 0.85, this.size * 0.6, this.size * 0.08)

        // low peaked roof, standing proud like the keep's rooftop
        push()
        translate(0, -lift)
        noStroke()
        fill(39)
        rect(0, 0, this.size * 0.85, this.size * 0.6, this.size * 0.08)
        strokeWeight(this.size / 35)
        if (red) {
            stroke(255, 180, 130, a)
            fill(230, 150, 90, (40 + 110 * pct) * a / 255)
        } else {
            stroke(180, 190, 255, a)
            fill(140, 150, 230, (40 + 110 * pct) * a / 255)
        }
        beginShape()
        vertex(-this.size * 0.46, this.size * 0.14)
        vertex(0, -this.size * 0.28)
        vertex(this.size * 0.46, this.size * 0.14)
        endShape(CLOSE)

        // rally banner + tier pips (visible investment, same language as vet pips)
        line(0, this.size * 0.14, 0, -this.size * 0.5)
        noFill()
        beginShape()
        vertex(0, -this.size * 0.5)
        vertex(this.size * 0.16, -this.size * 0.44)
        vertex(0, -this.size * 0.38)
        endShape()
        pop()

        noStroke()
        fill(255, 220, 120, 230)
        for (let i = 0; i < this.tier; i++) {
            ellipse((i - (this.tier - 1) / 2) * this.size / 3.2, -this.size * 0.62, this.size / 6.5)
        }

        if (this.takingDamageFrames > 0) {
            noStroke()
            fill(255, map(this.takingDamageFrames, 0, 10, 0, 90))
            rect(0, -lift, this.size * 0.85, this.size * 0.6, this.size * 0.08)
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

        const spec = BARRACKS_TIERS[this.tier]
        if (battleFrameCount % spec.period == 0) {
            let born = 0
            for (let i = 0; i < this.allies.length; i++) {
                const a = this.allies[i]
                if (a && !a.isDead && a._barracksBorn) born++
            }
            if (born < spec.cap) {
                // siege has a FIXED front — every wave approaches from the
                // east, always — so the muster line uses a fixed axis rather
                // than chasing whichever foe is nearest right now. A nearest-foe
                // chase sounds more "aware," but with foes scattered above and
                // below at different moments it flips sign tick to tick, which
                // flips the perpendicular lane axis too — so consecutive spawns
                // landed on OPPOSITE sides of the barracks instead of extending
                // the same line (this was the actual "not spawning in a line" bug).
                const ux = 1, uy = 0
                const px = -uy, py = ux // perpendicular to the advance — the garrison forms a RANK across it, not a queue behind it

                // spawn the whole squad this tick (as room allows); each body
                // takes the next open lane, so the standing garrison reads as
                // a growing LINE forming up, not a stack of bodies on one spot
                for (const kind of spec.squad) {
                    if (born >= spec.cap) break
                    const laneOffset = (born - (spec.cap - 1) / 2) * this.size * 0.55
                    const gx = this.pos.x + ux * this.size * 0.7 + px * laneOffset + random(-this.size * 0.05, this.size * 0.05)
                    const gy = this.pos.y + uy * this.size * 0.7 + py * laneOffset + random(-this.size * 0.05, this.size * 0.05)
                    const s = makeTroop(kind, gx, gy, this.team)
                    s._barracksBorn = true
                    this.allies.push(s)
                    spawnRing(gx, gy, this.team, this.size * 0.3)
                    born++
                }
            }
        }
    }
}
