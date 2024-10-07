function Healer(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'healer'
        this.team = team
        this.cost = 50
        this.forces = team == 'red' ? redForces : blueForces

        this.vel = createVector(0, 0)
        this.size = width / 130
        this.speed = this.size / 9;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = 90
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = 0
        this.attackSpeed = 100 //number of frames between attacks
        this.attackRange = this.size * 5
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

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
        // rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)


        drawSettings(team, tranparency, this.size)
        noFill();
        beginShape();
        let l = this.size / 6
        let offsetH = -this.size / 2
        vertex(-l / 2, offsetH);
        vertex(l / 2, offsetH);
        vertex(l / 2, offsetH - l);
        vertex(l / 2 + l, offsetH - l);
        vertex(l / 2 + l, offsetH - 2 * l);
        vertex(l / 2, offsetH - 2 * l);
        vertex(l / 2, offsetH - 3 * l);
        vertex(-l / 2, offsetH - 3 * l);
        vertex(-l / 2, offsetH - 2 * l);
        vertex(-l / 2 - l, offsetH - 2 * l);
        vertex(-l / 2 - l, offsetH - l);
        vertex(-l / 2, offsetH - l);
        vertex(-l / 2, offsetH);
        endShape();
        // sphere(this.size / 2)
        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }

        pop()
    }

    this.update = function (allies, foes) {
        if (this.isDead) return

        if (allies.length == 0) {
            this.target = this
            return
        }

        if (this.speed < this.maxSpeed) {
            this.speed += this.maxSpeed / 100
        }

        this.target = allies[0]

        // let sumVector = createVector(0, 0)
        let sumVector = createVector(this.pos.x, this.pos.y)
        allies.forEach(ally => {
            if (ally != this && ally.name != 'zombie' && !ally.isDead) {
                sumVector.add(p5.Vector.mult(p5.Vector.sub(ally.pos, this.pos).limit(this.speed), (1 - cb(ally.hitpoints / ally.maxHitpoints)) * sqr(width) * (1 / distSquared(this.pos, ally.pos) + 1)))
                // sumVector.add(p5.Vector.mult(ally.pos, 1))
                // if (ally.hitpoints / ally.maxHitpoints < this.target.hitpoints / this.target.maxHitpoints) {
                //     this.target = ally
                // }
            }
        })

        // sumVector.div(totalHp)
        // sumVector.add(this.pos)

        moveUnitTowards(this, sumVector, allies.concat(foes))

        if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
            this.attack();
        }

        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    this.attack = function () {
        this.forces.push(new HealPool(this.pos.x, this.pos.y, this.attackRange, team))
    }
}