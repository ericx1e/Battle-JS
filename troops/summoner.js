function Summoner(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'summoner'
        this.team = team
        this.cost = BALANCE.summoner.cost
        this.allies = team == 'red' ? redTroops : blueTroops

        this.vel = createVector(0, 0)
        this.size = width / 100
        this.speed = this.size / 25;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = BALANCE.summoner.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = 0
        this.attackSpeed = BALANCE.summoner.period //number of frames between attacks
        this.attackRange = this.size * 30
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))
        this._nextSpawnFrame = 0
        // this.drawSpeed = this.size * 2

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
        // rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        drawSettings(team, tranparency, this.size)
        noStroke()
        rectMode(CENTER)
        // rect(0, 0, this.size, this.size);
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)

        drawSettings(team, tranparency, this.size)
        noFill();
        beginShape();
        vertex(this.size / 2, -this.size / 2);
        vertex(this.size / 2, -this.size / 1.3);
        vertex(this.size / 4, -this.size / 1.5);
        vertex(0, -this.size / 1.1);
        vertex(-this.size / 4, -this.size / 1.5);
        vertex(-this.size / 2, -this.size / 1.3);
        vertex(-this.size / 2, -this.size / 2);
        vertex(this.size / 2, -this.size / 2);
        endShape();


        // sphere(this.size / 2)
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

        let removed = 0

        if (!rangedKite(this)) {
            moveUnit(this)
        }
        if (battleFrameCount >= this._nextSpawnFrame) {
            removed = this.attack();
        }
        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            for (let i = 0; i < 5; i++) {
                this.allies.push(makeTroop('zombie', this.pos.x + random(-this.size, this.size), this.pos.y + random(-this.size, this.size), team))
            }
            this.isDead = true
        }

        if (removed > 0) {
            return removed
        }
    }


    this.attack = function () {
        // the pack is bounded — and it is a TEAM resource: the dark art draws
        // from one well, so stacked summoners sustain sqrt-more, not linearly
        // more (a lone summoner keeps its full pack; 4 together get 2×, not 4×).
        // in a grinding fight the front dies constantly, so the feeding never
        // stops — but nobody banks an ever-growing horde.
        let pack = 0, lords = 0
        for (let i = 0; i < this.allies.length; i++) {
            const a = this.allies[i]
            if (!a || a.isDead) continue
            if (a._master) pack++
            if (a.name == 'summoner') lords++
        }
        const teamCap = ceil(BALANCE.summoner.packCap * Math.sqrt(max(1, lords)))
        const room = min(BALANCE.summoner.spawnCount, teamCap - pack)
        if (room <= 0) {
            this._nextSpawnFrame = battleFrameCount + 30 // full — watch for losses
            return
        }
        // bursty feeder: a depleted pack is replaced FAST (the dramatic part),
        // but a topped-up pack only trickles — the stream can't outpace what a
        // real army cuts down
        this._nextSpawnFrame = battleFrameCount + BALANCE.summoner.period * (1 + 2 * pack / teamCap)
        spawnRing(this.pos.x, this.pos.y, team, this.size * 2)
        for (let i = 0; i < room; i++) {
            const z = makeTroop('zombie', this.pos.x + 60 * this.vel.x + random(-this.size * 2, this.size * 2), this.pos.y + 60 * this.vel.y + random(-this.size * 2, this.size * 2), team)
            z._master = this // marks it as summoned (counts against the team pack)
            this.allies.push(z)
        }
    }
}