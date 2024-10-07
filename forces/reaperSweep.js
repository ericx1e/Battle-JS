function ReaperSweep(unit, range, damage, team) {
    this.name = 'reaper_sweep'
    this.pos = createVector(unit.pos.x, unit.pos.y)

    this.totalFrames = 5
    this.frames = this.totalFrames
    this.damage = damage
    this.range = range

    this.isDone

    this.hit = []

    this.update = function () {
        if (this.frames <= 0) {
            this.isDone = true
        }

        if (this.isDone) return

        if (this.frames == this.totalFrames) {
            let targetTeam = team == 'blue' ? 'red' : 'blue'
            collided = checkCollision(this.pos, this.range, targetTeam)
            collided.forEach(foe => {
                takeDamage(foe, this.damage)
                if (foe.hitpoints <= 0) {
                    if (foe.name != 'zombie') {
                        heal(unit, (unit.maxHitpoints - unit.hitpoints) * .15)
                    }
                }
                knockbackUnit(foe)
            });
        }

        this.frames--

        let transparency = 50 * this.frames / this.totalFrames + 1
        drawSettings(team, transparency)
        noStroke()
        ellipse(this.pos.x, this.pos.y, this.range * 2)
    }
}