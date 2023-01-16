function EWizard(x, y, team) {
    this.name = 'ewizard'
    this.cost = 50
    this.projectiles = team == 'red' ? redProjectiles : blueProjectiles

    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.size = width / 100
    this.speed = this.size / 15;
    this.maxSpeed = this.speed;
    this.target = this
    this.maxHitpoints = 50
    this.hitpoints = this.maxHitpoints
    this.targetHitpoints = this.hitpoints
    this.attackPower = 0
    this.attackSpeed = 200 //number of frames between attacks
    this.attackRange = this.size * 30
    this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

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
        noFill();

        let drawVec = p5.Vector.sub(createVector(this.size, this.size / 1.7), createVector(this.size, 0))
        let randMag = drawVec.mag() / 10
        push()
        translate(this.size / 1.9, -this.size / 4)
        rotate(PI / 10)
        beginShape()
        vertex(-drawVec.x, - drawVec.y)
        vertex(-drawVec.x / 2 + random(-randMag, randMag), - drawVec.y / 2 + random(-randMag, randMag))
        vertex(random(-randMag, randMag), random(-randMag, randMag))
        vertex(drawVec.x / 2 + random(-randMag, randMag), drawVec.y / 2 + random(-randMag, randMag))
        vertex(drawVec.x, drawVec.y)
        endShape()
        pop()
        // quad(this.size / 2, -this.size / 1.2, this.size / 2, this.size / 1.2, this.size / 1.5, this.size / 3, this.size / 1.5, -this.size / 3);

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

        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    this.attack = function () {
        this.projectiles.push(new Bolt(this.pos, this.target.pos, team))
    }
}