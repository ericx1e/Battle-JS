function Arc(target, team) {
    this.name = 'arc'

    this.target = target
    this.nextTarget;
    this.charges = 8
    this.damage = 30
    this.range = width / 50

    this.isDone

    this.hit = []

    this.update = function (foes) {
        if (this.charges <= 0) this.isDone = true
        if (foes.length == 0) {
            this.isDone = true
        }
        if (this.isDone) return
        this.nextTarget = undefined
        foes.forEach(foe => {
            if (!foe.isDead && !this.hit.includes(foe) && foe != this.target) {
                if (!this.nextTarget || distSquared(this.target.pos.x, this.target.pos.y, foe.pos.x, foe.pos.y) < distSquared(this.target.pos.x, this.target.pos.y, this.nextTarget.pos.x, this.nextTarget.pos.y)) {
                    this.nextTarget = foe
                }
            }
        })

        if (!this.nextTarget || distSquared(this.target.x, this.target.y, this.nextTarget.pos.x, this.nextTarget.pos.y) > this.range * this.range) {
            this.isDone = true
            return
        }

        let drawVec = p5.Vector.sub(this.nextTarget.pos, this.target.pos)
        let randMag = drawVec.mag() / 10
        drawSettings(team)
        stroke(255, 255, 0)
        fill(255, 255, 0)
        strokeWeight(width / 500)
        // ellipse(this.target.pos.x, this.target.pos.y, this.target.size / 2)
        noFill()
        beginShape()
        vertex(this.target.pos.x, this.target.pos.y)
        vertex(this.target.pos.x + drawVec.x / 4 + random(-randMag, randMag), this.target.pos.y + drawVec.y / 4 + random(-randMag, randMag))
        vertex(this.target.pos.x + drawVec.x / 2 + random(-randMag, randMag), this.target.pos.y + drawVec.y / 2 + random(-randMag, randMag))
        vertex(this.target.pos.x + drawVec.x * 3 / 4 + random(-randMag, randMag), this.target.pos.y + drawVec.y * 3 / 4 + random(-randMag, randMag))
        vertex(this.target.pos.x + drawVec.x, this.target.pos.y + drawVec.y)
        endShape()

        this.target.speed = 0
        this.target.takeDamage(this.damage)
        this.hit.push(this.target)
        this.target = this.nextTarget
        this.charges--
    }
}