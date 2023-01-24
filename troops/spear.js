function Spear(x, y, team) {
    this.name = 'spear'
    this.cost = 60
    this.projectiles = team == 'red' ? redProjectiles : blueProjectiles

    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.size = width / 100
    this.speed = this.size / 30;
    this.maxSpeed = this.speed;
    this.target = this
    this.maxHitpoints = 120
    this.hitpoints = this.maxHitpoints
    this.targetHitpoints = this.hitpoints
    this.attackPower = 8
    this.attackSpeed = 30 //number of frames between attacks
    this.rangedAttackSpeed = 90 //number of frames between attacks
    this.attackRange = this.size * 3
    this.rangedAttackRange = this.size * 30
    this.firstAttackFrame = parseInt(random(0, this.attackSpeed))
    this.firstRangedAttackFrame = parseInt(random(0, this.rangedAttackSpeed))
    this.charges = 3

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
        drawSettings(team, tranparency)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
        this.drawSpear(this.size / 5, this.size / 5, team, tranparency)

        for (let i = 0; i < this.charges; i++) {
            push()
            translate(-this.size / 2, this.size / 3)
            rotate(-PI / 1.7 + PI / 60 * i)
            this.drawSpear(0, i / 1.7, team, tranparency)
            pop()
        }

        // sphere(this.size / 2)
        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }

        pop()
    }

    this.drawSpear = function (x, y, team, tranparency) {
        push()
        translate(x, y)
        drawSettings(team, tranparency)
        push()
        translate(this.size * 1.2, 0)
        line(-this.size * 1.5, 0, 0, 0)
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
            if ((frameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack();
            }
            // this.checkCollision(allies.concat(foes))
        }
        if (this.charges > 0 && distSquared(this.pos, this.target.pos) < sqr(this.rangedAttackRange)) {
            if ((frameCount - this.firstRangedAttackFrame) % this.rangedAttackSpeed == 0) {
                this.rangedAttack();
                this.charges--
            }
        }


        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    this.attack = function () {
        takeDamage(this.target, this.attackPower)
        let moveVector = p5.Vector.sub(this.target.pos, this.pos).setMag(this.target.speed * 2)
        this.target.pos.add(moveVector)
        this.target.speed = -this.maxSpeed
    }

    this.rangedAttack = function () {
        this.projectiles.push(new ThrownSpear(this.pos, this.target.pos, team))
    }
}