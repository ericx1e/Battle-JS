function ThrownSpear(start, target, team) {
    this.pos = createVector(start.x, start.y)
    this.size = width / 100
    this.speed = this.size * .9
    this.vel = p5.Vector.sub(target, this.pos).limit(this.speed)
    this.vel.rotate(random(-0.05, 0.05))
    this.rotation = atan2(this.vel.y, this.vel.x)
    let drawVec = createVector(this.vel.x, this.vel.y).setMag(this.size)
    this.pos.add(p5.Vector.mult(drawVec, 2))
    this.damage = 50
    this.hit = []
    // this.pierce = 5

    this.show = function () {
        drawSettings(team)
        // line(this.pos.x + drawVec.x, this.pos.y + drawVec.y, this.pos.x - drawVec.x, this.pos.y - drawVec.y)
        push()
        translate(this.pos.x, this.pos.y)
        rotate(this.rotation)
        this.drawSpear(0, 0, team)
        /*
        line(-this.size * 5, 0, 0, 0)
        push()
        // translate(-this.size * 5, 0)
        let tipS = this.size / 2
        beginShape()
        vertex(0, tipS / 2)
        vertex(tipS, tipS / 2 * 3 / 4)
        vertex(3 * tipS, 0)
        vertex(tipS, -tipS / 2 * 3 / 4)
        vertex(0, -tipS / 2)
        vertex(0, tipS / 2)
        endShape()
        pop()
        */
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

    this.move = function (targets) {
        this.pos.add(this.vel)

        // this.vel.mult(0.98)
        if (this.vel.mag() <= this.speed / 5) {
            return true
        }
        for (let i = 0; i < targets.length; i++) {
            other = targets[i];
            if (other == this || other.isDead) {
                continue
            }

            if (!this.hit.includes(other) && distSquared(this.pos, other.pos) < sqr(this.size / 2 + other.size)) {
                takeDamage(other, this.damage)
                this.hit.push(other)
                other.pos.add(this.vel)
                other.speed = 0
                // knockbackUnit(other, targets)
                this.vel.mult(0.9)
                this.damage = this.damage * 0.9
                // let moveVector = p5.Vector.sub(other.pos, this.pos).setMag(other.speed * 2)
                // other.pos.add(moveVector)
                // other.speed = -other.maxSpeed
            }

            if (this.pos.x + this.size < 0 || this.pos.x + this.size > width || this.pos.y + this.size < 0 || this.pos.y + this.size > height) {
                return true
            }
        }
    }
}