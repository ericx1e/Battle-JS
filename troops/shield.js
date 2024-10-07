function Shield(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'shield'
        this.team = team
        this.cost = 30
        this.vel = createVector(0, 0)
        this.size = width / 60
        this.speed = this.size / 30;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = 400
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = 3
        this.attackSpeed = 15 //number of frames between attacks
        this.attackRange = this.size * 1.5
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.armor = 2 // reduces all damage taken TODO: implement this lol

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
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
        drawSettings(team, tranparency, this.size)
        // noFill();
        beginShape();
        vertex(this.size / 4, -this.size / 2.5);
        vertex((this.size / 1.5 + this.size / 4) / 2, -this.size / 2.1);
        vertex(this.size / 1.5, -this.size / 2.5);
        vertex(this.size / 1.5, this.size / 2.5);
        vertex((this.size / 1.5 + this.size / 4) / 2, this.size / 2.1);
        vertex(this.size / 4, this.size / 2.5);
        vertex(this.size / 4, -this.size / 2.5);
        endShape();
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
        takeDamage(this.target, this.attackPower)
        knockbackUnit(this.target)

        // let moveVector = p5.Vector.sub(this.target.pos, this.pos).setMag(this.target.speed * 2)
        // this.target.pos.add(moveVector)
        // this.target.speed = -this.maxSpeed
    }
}