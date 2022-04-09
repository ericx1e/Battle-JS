function Bolt(start, target, team) {
    this.forces = team == 'red' ? redForces : blueForces
    this.pos = createVector(start.x, start.y)
    this.size = width / 110
    this.speed = this.size
    this.vel = p5.Vector.sub(target, this.pos).limit(this.speed)
    this.vel.rotate(random(-0.05, 0.05))
    let drawVec = createVector(this.vel.x, this.vel.y).setMag(this.size)
    this.pos.add(p5.Vector.mult(drawVec, 2))
    this.damage = 100

    this.show = function () {
        let randMag = this.size / 4
        drawSettings(team)
        noFill()
        beginShape()
        vertex(this.pos.x - drawVec.x, this.pos.y - drawVec.y)
        vertex(this.pos.x - drawVec.x / 2 + random(-randMag, randMag), this.pos.y - drawVec.y / 2 + random(-randMag, randMag))
        vertex(this.pos.x + random(-randMag, randMag), this.pos.y + random(-randMag, randMag))
        vertex(this.pos.x + drawVec.x / 2 + random(-randMag, randMag), this.pos.y + drawVec.y / 2 + random(-randMag, randMag))
        vertex(this.pos.x + drawVec.x, this.pos.y + drawVec.y)
        endShape()
    }

    this.move = function (targets) {
        this.pos.add(this.vel)

        for (let i = 0; i < targets.length; i++) {
            other = targets[i];
            if (other == this) {
                continue
            }

            let r = this.size / 2 + other.size;

            if (distSquared(this.pos.x, this.pos.y, other.pos.x, other.pos.y) < r * r) {
                other.takeDamage(this.damage)
                this.forces.push(new Arc(other, team))
                return true
            }

            if (this.pos.x + this.size < 0 || this.pos.x + this.size > width || this.pos.y + this.size < 0 || this.pos.y + this.size > height) {
                return true
            }
        }
    }
}