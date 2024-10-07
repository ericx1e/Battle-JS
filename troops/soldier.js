function Soldier(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'soldier'
        this.team = team
        this.cost = 10
        this.vel = createVector(0, 0)
        this.size = width / 100
        this.speed = this.size / 10;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = 140
        if (mode == 'autochess') {
            if (autochessEngine && autochessEngine.buffs.includes('soldier_health') && team == 'red') {
                this.maxHitpoints *= 1.5
            }
        }
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = 10
        this.attackSpeed = 40 //number of frames between attacks
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
        rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        rotate(this.attackRotate)
        if (this.attackRotate > 0) {
            this.attackRotate *= 0.90
            this.attackRotate -= PI / 50
        }
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)

        drawSettings(team, tranparency, this.size)
        let s = this.size / 4
        push()
        translate(this.size / 2, 0)
        rotate(PI / 4)
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
        if (distSquared(this.pos, this.target.pos) < sqr(this.attackRange)) {
            if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack();
            }
            // this.checkCollision(allies.concat(foes))
        }

        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    this.attack = function () {
        this.attackRotate = PI / 3
        takeDamage(this.target, this.attackPower)
    }
}