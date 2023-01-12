function Healer(x, y, team) {
    this.name = 'healer'
    this.forces = team == 'red' ? redForces : blueForces

    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.size = width / 100
    this.speed = this.size / 8;
    this.maxSpeed = this.speed;
    this.target = this
    this.maxHitpoints = 60
    this.hitpoints = this.maxHitpoints
    this.targetHitpoints = this.hitpoints
    this.attackPower = 0
    this.attackSpeed = 100 //number of frames between attacks
    this.attackRange = this.size * 5
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
        // rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        drawSettings(team, tranparency)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)


        drawSettings(team, tranparency)
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

        allies.forEach(ally => {
            if (!ally.isDead) {
                if (ally.hitpoints / ally.maxHitpoints < this.target.hitpoints / this.target.maxHitpoints) {
                    this.target = ally
                }
            }
        })

        moveUnit(this, allies.concat(foes))

        if ((frameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
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