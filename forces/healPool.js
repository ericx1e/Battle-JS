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

    this.update = function () {
        if (this.frames <= 0) {
            this.isDone = true
        }
        this.frames--

        if (this.isDone) return

        collided = checkCollision(this.pos, this.range, team)

        collided.forEach(ally => {
            if (ally.id == 'healer') {
                heal(ally, this.heal / 3)
            } else {
                heal(ally, this.heal)
            }
        });

        let transparency = 50 * this.frames / this.totalFrames + 1
        drawSettings(team, transparency)
        fill(120, 255, 120, transparency)
        ellipse(this.pos.x, this.pos.y, this.range * 2)
    }
}