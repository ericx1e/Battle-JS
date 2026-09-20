function Phalanx(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'phalanx'
        this.team = team
        this.cost = BALANCE.phalanx.cost
        this.vel = createVector(0, 0)
        this.size = width / 85
        this.speed = this.size / 12; // marches at line pace — the brace belongs at the front
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = BALANCE.phalanx.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.phalanx.atk
        this.attackSpeed = BALANCE.phalanx.period //number of frames between attacks
        this.attackRange = this.size * 2.8 // strikes over the shield
        this.thrustReach = this.attackRange * 1.35 // the thrust runs deeper than the guard range
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.armor = BALANCE.phalanx.armor // flat damage reduction per hit (see damage.js)
        this.blockMelee = 0.5              // braced: frontal melee damage halved
        this.blockedFrames = 0             // shield flash on a successful block

        this.attackJab = 0 // frames of forward spear thrust

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
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)

        // held gear rides at HAND height: drop toward the ground plane in
        // screen space first, then aim each piece at the foe
        translate(0, this.size * 0.24)

        // shield held in front, turning with the man — gear always points
        // where the unit faces
        push()
        rotate(unitFacing(this))
        drawSettings(team, tranparency, this.size)
        if (this.blockedFrames > 0) {
            stroke(255, 255 * this.blockedFrames / 8)
            fill(255, 150 * this.blockedFrames / 8)
            this.blockedFrames--
        }
        beginShape();
        vertex(this.size / 4, -this.size / 3);
        vertex(this.size / 2.4, -this.size / 2.6);
        vertex(this.size / 2, -this.size / 3);
        vertex(this.size / 2, this.size / 3);
        vertex(this.size / 2.4, this.size / 2.6);
        vertex(this.size / 4, this.size / 3);
        vertex(this.size / 4, -this.size / 3);
        endShape();
        pop()

        // the sarissa rides SCREEN-ABOVE the hand whichever way he faces —
        // only its aim rotates. THRUSTS down its strike lane on attack:
        // snaps out to full reach and recoils (sine profile peaks mid-swing)
        push()
        translate(0, -this.size / 3)
        rotate(unitFacing(this))
        let jab = 0
        if (this.attackJab > 0) {
            const t = sin(PI * this.attackJab / 8)
            jab = (this.thrustReach - this.attackRange * 0.55) * t
            // fading streak marks the lane the sarissa just ran through
            stroke(255, 70 * t)
            strokeWeight(this.size / 7)
            line(this.size / 2, 0, this.thrustReach, 0)
            this.attackJab--
        }
        translate(this.size * 0.9 + jab, 0)
        drawSettings(team, tranparency, this.size)
        line(-this.size * 1.3, 0, 0, 0)
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

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    // the sarissa THRUSTS through the press: everyone standing in the spear's
    // lane is run through — up to 3, nearest first. a rank weapon, not a duel
    // weapon: it rewards catching a packed line head-on.
    this.attack = function () {
        this.attackJab = 8
        const ang = atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x)
        const cosA = cos(ang), sinA = sin(ang)
        const lane = this.size * 0.8 // half-width of the strike lane
        // shared buffer: must be fully drained into skewered before any takeDamage
        const foes = checkTeamCollision(this.pos, this.thrustReach, team == 'red' ? 'blue' : 'red')
        const skewered = []
        for (let i = 0; i < foes.length; i++) {
            const f = foes[i]
            if (!f || f.isDead) continue
            const dx = f.pos.x - this.pos.x, dy = f.pos.y - this.pos.y
            const along = dx * cosA + dy * sinA
            // structures count reach to their edge — the keep's center sits
            // beyond any thrust, but its body is right on the spearpoint
            if (along < 0 || along > this.thrustReach + reachBonus(f)) continue // behind, or past the tip
            if (abs(dy * cosA - dx * sinA) > lane + f.size / 2) continue // off the shaft
            skewered.push(f)
        }
        skewered.sort((a, b) => distSquared(this.pos, a.pos) - distSquared(this.pos, b.pos))
        for (let i = 0; i < skewered.length && i < 3; i++) {
            takeDamage(skewered[i], this.attackPower, this, true) // a pierce: no follow-through
        }
    }
}
