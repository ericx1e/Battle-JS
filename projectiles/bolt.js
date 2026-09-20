function Bolt(start, target, team) {
    this.forces = team == 'red' ? redForces : blueForces
    this.pos = createVector(start.x, start.y)
    this.size = width / 110
    this.speed = this.size
    this.vel = p5.Vector.sub(target, this.pos).limit(this.speed)
    this.vel.rotate(random(-0.05, 0.05))
    let drawVec = createVector(this.vel.x, this.vel.y).setMag(this.size)
    this.pos.add(p5.Vector.mult(drawVec, 2))
    this.damage = 0

    this.show = function () {
        let randMag = this.size / 4
        const lift = bodyLift(width / 100) // flies at the standing plane
        // crackling shadow on the ground beneath the bolt
        noStroke()
        fill(0, 60 + random(-15, 15))
        ellipse(this.pos.x, this.pos.y, this.size * 1.5, this.size * 0.5)
        drawSettings(team)
        noFill()
        beginShape()
        vertex(this.pos.x - drawVec.x, this.pos.y - drawVec.y - lift)
        vertex(this.pos.x - drawVec.x / 2 + random(-randMag, randMag), this.pos.y - drawVec.y / 2 + random(-randMag, randMag) - lift)
        vertex(this.pos.x + random(-randMag, randMag), this.pos.y + random(-randMag, randMag) - lift)
        vertex(this.pos.x + drawVec.x / 2 + random(-randMag, randMag), this.pos.y + drawVec.y / 2 + random(-randMag, randMag) - lift)
        vertex(this.pos.x + drawVec.x, this.pos.y + drawVec.y - lift)
        endShape()
    }

    this.move = function () {
        this.pos.add(this.vel)
        let targetTeam = team == 'blue' ? 'red' : 'blue'
        let collided = checkTeamCollision(this.pos, this.size / 2, targetTeam)
        if (collided.length) {
            let other = collided[0]
            takeDamage(other, this.damage)
            for (let i = 0; i < 5; i++) {
                this.forces.push(new Arc(other, team, this.dmgMult))
            }
            return true
        }
        if (this.pos.x - this.size < 0 || this.pos.x + this.size > width || this.pos.y - this.size < 0 || this.pos.y + this.size > height) {
            return true
        }
    }
}