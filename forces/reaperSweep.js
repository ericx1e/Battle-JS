function ReaperSweep(unit, range, damage, team) {
    this.name = 'reaper_sweep'
    this.pos = createVector(unit.pos.x, unit.pos.y)

    this.totalFrames = 5
    this.frames = this.totalFrames
    this.damage = damage
    this.range = range

    this.isDone

    this.hit = []

    this.update = function (allies, foes) {
        if (this.frames <= 0) {
            this.isDone = true
        }

        if (foes.length == 0) {
            this.isDone = true
        }
        if (this.isDone) return

        if (this.frames == this.totalFrames) {
            foes.forEach(foe => {
                if (distSquared(this.pos, foe.pos) < sqr(this.range)) {
                    takeDamage(foe, this.damage)
                    if (foe.hitpoints <= 0) {
                        heal(unit, (unit.maxHitpoints - unit.hitpoints) * .05);
                    }
                    let moveVector = p5.Vector.sub(foe.pos, this.pos).setMag(foe.speed * 2)
                    foe.pos.add(moveVector)
                    foe.speed = -foe.maxSpeed / 2
                }
            })
        }

        this.frames--

        let transparency = 50 * this.frames / this.totalFrames + 1
        drawSettings(team, transparency)
        noStroke()
        ellipse(this.pos.x, this.pos.y, this.range * 2)
    }
}