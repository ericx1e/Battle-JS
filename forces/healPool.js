function HealPool(x, y, range, team) {
    this.name = 'heal_pool'
    this.pos = createVector(x, y)

    this.totalFrames = 80
    this.frames = this.totalFrames
    let totalHeal = 40
    this.heal = totalHeal / this.totalFrames
    this.range = range

    this.isDone

    this.hit = []

    this.update = function (allies, foes) {
        if (this.frames <= 0) {
            this.isDone = true
        }
        this.frames--

        if (allies.length == 0) {
            this.isDone = true
        }
        if (this.isDone) return

        allies.forEach(ally => {
            if (distSquared(this.pos, ally.pos) < sqr(this.range)) {
                heal(ally, this.heal)
            }
        })

        let transparency = 50 * this.frames / this.totalFrames + 1
        drawSettings(team, transparency)
        fill(120, 255, 120, transparency)
        ellipse(this.pos.x, this.pos.y, this.range * 2)
    }
}