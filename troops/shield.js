function Shield(x, y, team) {
    this.name = 'shield'
    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.size = width / 80
    this.speed = this.size / 30;
    this.maxSpeed = this.speed;
    this.target = this
    this.maxHitpoints = 300
    this.hitpoints = this.maxHitpoints
    this.targetHitpoints = this.hitpoints
    this.attackPower = 3
    this.attackSpeed = 15 //number of frames between attacks
    this.attackRange = this.size * 1.5
    this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

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
        drawSettings(team, tranparency)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
        drawSettings(team, tranparency)
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

        this.target = foes[0]
        foes.forEach(foe => {
            if (!foe.isDead) {
                if (distSquared(this.pos.x, this.pos.y, foe.pos.x, foe.pos.y) < distSquared(this.pos.x, this.pos.y, this.target.pos.x, this.target.pos.y)) {
                    this.target = foe
                }
            }
        })

        this.move(foes.concat(allies))
        if (distSquared(this.pos.x, this.pos.y, this.target.pos.x, this.target.pos.y) < this.attackRange * this.attackRange) {
            if ((frameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
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
        this.target.takeDamage(this.attackPower)
        let moveVector = p5.Vector.sub(this.target.pos, this.pos).setMag(this.target.speed * 2)
        this.target.pos.add(moveVector)
        this.target.speed = -this.maxSpeed
    }

    this.takeDamage = function (damage) {
        this.hitpoints -= (damage - this.armor)
        this.hitpoints = Math.max(this.hitpoints, 0)
        // this.targetHitpoints -= damage
        // this.takingDamageFrames = 20;
    }

    this.move = function (others) {
        if (distSquared(this.pos.x, this.pos.y, this.target.pos.x, this.target.pos.y) > (this.attackRange * this.attackRange) * (0.9 * 0.9)) {
            this.vel = p5.Vector.sub(this.target.pos, this.pos).limit(this.speed)
            // stroke(255)
            // line(this.pos.x, this.pos.y, this.pos.x + this.vel.x * 15, this.pos.y + this.vel.y * 15);
            this.pos.add(this.vel)
        }
        this.checkCollision(others)
        this.checkBoundaries()
        // if (this.isColliding(others)) {
        //     this.pos.sub(this.vel.mult(random(0.5, 3)))
        // }
    }

    this.checkCollision = function (others) {
        let squeezeVel = createVector(0, 0)
        for (let i = 0; i < others.length; i++) {
            other = others[i];
            if (other.isDead) continue
            if (other == this) {
                continue
            }
            let minDist = this.size / 2 + other.size / 2
            if (distSquared(this.pos.x, this.pos.y, other.pos.x, other.pos.y) < minDist * minDist) {
                let moveVector = p5.Vector.sub(this.pos, other.pos).limit(this.speed * random(0.4, 0.5))
                squeezeVel.add(moveVector)
                other.pos.sub(moveVector)
            }
        }
        this.pos.add(squeezeVel)
    }

    this.checkBoundaries = function () {
        if (this.pos.x > width) {
            this.pos.add(createVector(-this.size / 2, 0))
        }
        if (this.pos.x < 0) {
            this.pos.add(createVector(this.size / 2, 0))
        }
        if (this.pos.y > height) {
            this.pos.add(createVector(0, -this.size / 2))
        }
        if (this.pos.y < 0) {
            this.pos.add(createVector(0, this.size / 2))
        }
    }
}