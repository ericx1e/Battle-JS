function Fireball(start, target, team) {
    this.forces = team == 'red' ? redForces : blueForces
    this.pos = createVector(start.x, start.y)
    this.size = width / 130
    this.speed = this.size * 0.6 // slow and readable — you can see it coming
    this.vel = p5.Vector.sub(target, this.pos).limit(this.speed)
    this.vel.rotate(random(-0.05, 0.05))
    let drawVec = createVector(this.vel.x, this.vel.y).setMag(this.size)
    this.pos.add(p5.Vector.mult(drawVec, 2))
    this.damage = BALANCE.fwizard.atk
    this.burstRange = width / 30

    this.show = function () {
        // hovers at the standing plane with a slow magical bob
        const lift = bodyLift(width / 100) + this.size * 0.18 * sin(frameCount * 0.15)
        // firelight flickering on the ground beneath — a glow, not a shadow
        noStroke()
        fill(255, 120, 40, 28 + random(-6, 6))
        ellipse(this.pos.x, this.pos.y, this.size * 2.6, this.size * 1.1)
        fill(255, 100, 30, 200)
        ellipse(this.pos.x, this.pos.y - lift, this.size)
        fill(255, 200, 60, 220)
        ellipse(this.pos.x, this.pos.y - lift, this.size * 0.5)
        if (frameCount % 3 == 0) {
            spawnEmbers(this.pos.x, this.pos.y - lift, 1, this.size)
        }
    }

    this.move = function () {
        this.pos.add(this.vel)
        let targetTeam = team == 'blue' ? 'red' : 'blue'
        let collided = checkTeamCollision(this.pos, this.size / 2, targetTeam)
        if (collided.length) {
            this.forces.push(new FireBurst(this.pos.x, this.pos.y, this.burstRange, this.damage, team))
            return true
        }
        if (this.pos.x - this.size < 0 || this.pos.x + this.size > width || this.pos.y - this.size < 0 || this.pos.y + this.size > height) {
            return true
        }
    }
}
