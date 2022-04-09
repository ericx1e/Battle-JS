function Arrow(start, target, team) {
    this.pos = createVector(start.x, start.y)
    this.size = width / 250
    this.speed = this.size / 2
    this.vel = p5.Vector.sub(target, this.pos).limit(this.speed)
    this.vel.rotate(random(-0.1, 0.1))
    let drawVec = createVector(this.vel.x, this.vel.y).setMag(this.size)
    this.pos.add(p5.Vector.mult(drawVec, 2))
    this.damage = 15

    this.show = function () {
        drawSettings(team)
        line(this.pos.x + drawVec.x, this.pos.y + drawVec.y, this.pos.x - drawVec.x, this.pos.y - drawVec.y)
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
                return true
            }

            if (this.pos.x + this.size < 0 || this.pos.x + this.size > width || this.pos.y + this.size < 0 || this.pos.y + this.size > height) {
                return true
            }
        }
    }
}