function Necromancer(x, y, team) {
    this.name = 'necromancer'
    this.allies = team == 'red' ? redTroops : blueTroops
    this.toRemove = team == 'red' ? redToRemove : blueToRemove

    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.size = width / 100
    this.speed = this.size / 25;
    this.maxSpeed = this.speed;
    this.target = this
    this.maxHitpoints = 100
    this.hitpoints = this.maxHitpoints
    this.targetHitpoints = this.hitpoints
    this.attackPower = 0
    this.attackSpeed = 1 //number of frames between attacks
    this.attackRange = this.size * 15
    this.firstAttackFrame = parseInt(random(0, this.attackSpeed))
    // this.drawSpeed = this.size * 2

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
        // rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        drawSettings(team, tranparency)
        noStroke()
        rectMode(CENTER)
        // rect(0, 0, this.size, this.size);
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)

        drawSettings(team, tranparency)

        noFill();
        line(this.size / 2, this.size / 3, this.size / 2, -this.size / 2)
        let s = this.size / 3
        arc(this.size / 2, -this.size / 2 - s / 2, s * 1.5, s, -PI / 2, PI / 2)
        /*
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
        */


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

        this.target = foes[0]

        let targetDist = distSquared(this.pos.x, this.pos.y, this.target.pos.x, this.target.pos.y)
        foes.forEach(foe => {
            if (!foe.isDead) {
                let dist = distSquared(this.pos.x, this.pos.y, foe.pos.x, foe.pos.y)
                if (dist < targetDist) {
                    this.target = foe
                    targetDist = dist
                }
            }
        })

        let removed = 0

        this.move(foes.concat(allies))
        if ((frameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
            removed = this.attack();
        }
        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            for (let i = 0; i < 10; i++) {
                this.allies.push(new Zombie(this.pos.x + random(-this.size, this.size), this.pos.y + random(-this.size, this.size), team))
            }
            this.isDead = true
        }

        if (removed > 0) {
            return removed
        }
    }


    this.attack = function () {
        let removed = 0
        for (let i = 0; i < this.toRemove.length; i++) {
            let subject = this.toRemove[i]
            let index = this.allies.indexOf(subject)
            if (!subject || index == -1) {
                continue
            }
            subject.vel = p5.Vector.sub(this.pos, subject.pos)
            let dist = distSquared(this.pos.x, this.pos.y, subject.pos.x, subject.pos.y)
            subject.vel.setMag(width * 40 / dist)
            subject.vel.limit(width / 20)
            subject.pos.add(subject.vel)


            let r = this.size * this.size * 10
            if (dist < r && subject.name != 'zombie') {
                this.allies.splice(index, 1)
                removed++
                this.toRemove.splice(index, 1)
                i--
                this.allies.push(new Zombie(subject.pos.x, subject.pos.y, team))
            }
        }
        return removed
    }

    this.takeDamage = function (damage) {
        this.hitpoints -= damage
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