function Arrow(start, target, team) {
    this.pos = createVector(start.x, start.y)
    this.size = width / 250
    this.speed = this.size / 1.5
    this.vel = p5.Vector.sub(target, this.pos).limit(this.speed)
    this.vel.rotate(random(-0.05, 0.05))
    this.rotation = atan2(this.vel.y, this.vel.x)
    let drawVec = createVector(this.vel.x, this.vel.y).setMag(this.size)
    this.pos.add(p5.Vector.mult(drawVec, 2))
    this.damage = 25

    this.show = function () {
        drawSettings(team)
        push()
        translate(this.pos.x, this.pos.y)
        rotate(this.rotation)
        push()
        translate(this.size * 1.2, 0)
        line(-this.size * 1.5, 0, 0, 0)
        let tailS = this.size / 8
        beginShape()
        vertex(-this.size * 1.5 - tailS, tailS)
        vertex(-this.size * 1.5, 0)
        vertex(-this.size * 1.5 - tailS, -tailS)
        endShape()
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
        // line(this.pos.x + drawVec.x, this.pos.y + drawVec.y, this.pos.x - drawVec.x, this.pos.y - drawVec.y)
    }

    this.move = function () {
        this.pos.add(this.vel)
        let targetTeam = team == 'blue' ? 'red' : 'blue'
        let collided = checkCollision(this.pos, this.size / 2, targetTeam)
        if (collided.length) {
            takeDamage(collided[0], this.damage)
            return true
        }
        if (this.pos.x - this.size < 0 || this.pos.x + this.size > width || this.pos.y - this.size < 0 || this.pos.y + this.size > height) {
            return true
        }
    }
}