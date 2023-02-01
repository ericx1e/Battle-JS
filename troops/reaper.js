function Reaper(x, y, team) {
    this.name = 'reaper'
    this.cost = 100
    this.forces = team == 'red' ? redForces : blueForces

    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.size = width / 80
    this.speed = this.size / 20;
    this.maxSpeed = this.speed;
    this.target = this
    this.maxHitpoints = 200
    this.hitpoints = this.maxHitpoints
    this.targetHitpoints = this.hitpoints
    this.attackPower = 35
    this.attackSpeed = 45 //number of frames between attacks
    this.attackRange = this.size * 2
    this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

    this.attackRotate = 0

    this.armor = 2 // reduces all damage taken

    this.takingDamageFrames = 0 //animation for getting hit

    this.isDead = false

    this.show = function (tranparency) {
        push()
        translate(this.pos.x, this.pos.y)

        if (healthBars) {
            strokeWeight(width / 500)
            stroke(150)
            line(-this.size, -this.size, this.size, -this.size)
            colorMode(HSB, this.maxHitpoints, 255, 255, 255)
            stroke(30 * this.hitpoints / this.maxHitpoints, 255, 255)
            line(-this.size, -this.size, -this.size + 2 * this.size * this.hitpoints / this.maxHitpoints, -this.size)
        }

        drawSettings(team, tranparency)
        noFill()
        arc(0, 0, this.size, this.size, PI / 2 - PI * this.hitpoints / this.maxHitpoints, PI / 2 + PI * this.hitpoints / this.maxHitpoints, OPEN)
        rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        rotate(this.attackRotate)
        if (this.attackRotate < 0) {
            this.attackRotate *= 0.90
            this.attackRotate += PI / 50
        }
        drawSettings(team, tranparency)

        let s = this.size / 4
        push()
        translate(this.size / 2, 0)
        rotate(PI / 16)
        line(0, s, 0, -5 * s)
        let r = s * 10
        noFill()
        arc(0, +r / 2 - 5 * s, r, r, -PI / 2, -PI / 2 + PI / 4)
        arc(0, +r / 2 - 4 * s, r * 2, r, -PI / 2, -PI / 2 + PI / 5.2)
        pop()

        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
        drawSettings(team, tranparency)
        // noFill();
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

        this.target = foes[0]

        let targetDist = distSquared(this.pos, this.target.pos)
        foes.forEach(foe => {
            if (!foe.isDead) {
                let dist = distSquared(this.pos, foe.pos)
                if (dist < targetDist) {
                    this.target = foe
                    targetDist = dist
                }
            }
        })

        moveUnit(this, allies.concat(foes))
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
        this.attackRotate = -4 * PI
        this.forces.push(new ReaperSweep(this, this.attackRange, this.attackPower, team))
    }
}