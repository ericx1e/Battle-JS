function FireBurst(x, y, range, damage, team) {
    this.name = 'fire_burst'
    this.pos = createVector(x, y)

    this.totalFrames = 90 // burst hit, then burning ground
    this.frames = this.totalFrames
    this.damage = damage
    this.burnDamage = BALANCE.fwizard.burnDamage * (damage / BALANCE.fwizard.atk) // burn scales with the fireball
    this.burnTicks = 5
    this.range = range

    this.isDone

    this.update = function () {
        if (this.frames <= 0) {
            this.isDone = true
        }

        if (this.isDone) return

        let targetTeam = team == 'blue' ? 'red' : 'blue'

        if (this.frames == this.totalFrames) {
            // impact hit
            // copy: takeDamage reuses the shared collision buffer mid-loop
            let collided = checkTeamCollision(this.pos, this.range, targetTeam).slice()
            collided.forEach(foe => {
                takeDamage(foe, this.damage)
            })
            spawnEmbers(this.pos.x, this.pos.y, 8, this.range / 2)
            spawnRing(this.pos.x, this.pos.y, 'fire', this.range)
        } else if (this.frames % (this.totalFrames / this.burnTicks) == 0) {
            // burn ticks on anyone standing in the fire
            let collided = checkTeamCollision(this.pos, this.range * 0.8, targetTeam).slice()
            collided.forEach(foe => {
                takeDamage(foe, this.burnDamage / this.burnTicks)
            })
            spawnEmbers(this.pos.x, this.pos.y, 2, this.range / 3)
        }

        this.frames--

        // the burning pool lies ON the field: squashed like every ground plane
        let transparency = 90 * this.frames / this.totalFrames + 1
        noStroke()
        fill(255, 100, 30, transparency)
        ellipse(this.pos.x, this.pos.y, this.range * 2, this.range * 1.3)
        fill(255, 200, 60, transparency * 0.6)
        ellipse(this.pos.x, this.pos.y, this.range * 1.2, this.range * 0.78)

        // the blast itself goes UP: a hot core that rises, spreads, and cools
        // in the first moments after impact
        const age = this.totalFrames - this.frames
        const plumeFrames = 22
        if (age < plumeFrames) {
            const k = age / plumeFrames
            fill(255, 130, 40, 170 * (1 - k))
            ellipse(this.pos.x, this.pos.y - this.range * (0.25 + 0.85 * k), this.range * (0.85 - 0.35 * k))
            fill(255, 220, 90, 200 * (1 - k))
            ellipse(this.pos.x, this.pos.y - this.range * (0.2 + 0.65 * k), this.range * 0.5 * (1 - 0.5 * k))
        }
    }
}
