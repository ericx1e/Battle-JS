function Arc(target, team) {
    this.name = 'arc'

    this.target = target
    this.nextTarget;
    this.charges = 12
    this.damage = 10
    this.range = width / 25

    this.isDone

    this.hit = []

    this.update = function () {
        if (this.charges <= 0) this.isDone = true
        if (this.isDone) return

        // this.nextTarget = foes[0]
        // let dist = distSquared(this.target.pos, this.nextTarget.pos)
        // for (let i = 1; i < foes.length; i++) {
        //     let foe = foes[i]
        //     if (!foe.isDead && !this.hit.includes(foe) && foe != this.target) {
        //         let curDist = distSquared(this.target.pos, foe.pos)
        //         if (curDist < dist) {
        //             if (random(0, 1) > 0.25) {
        //                 this.nextTarget = foe
        //                 dist = curDist
        //             }
        //         }
        //     }
        // }

        let targetTeam = team == 'blue' ? 'red' : 'blue'
        collided = checkCollision(this.target.pos, this.range, targetTeam)
        if (!collided.length) {
            this.isDone = true
            return
        }

        // this.nextTarget = collided[floor(random(0, collided.length))]

        this.nextTarget = collided[0]
        let dist = width // big number
        for (let i = 1; i < collided.length; i++) {
            let foe = collided[i]
            if (!this.hit.includes(foe) && foe != this.target) {
                let curDist = distSquared(this.target.pos, foe.pos)
                if (curDist < dist) {
                    if (random(0, 1) > 0.25) {
                        this.nextTarget = foe
                        dist = curDist
                    }
                }
            }
        }

        if (this.hit.includes(this.nextTarget)) {
            this.isDone = true
            return
        }

        this.target.speed = 0
        takeDamage(this.target, this.damage)
        this.hit.push(this.target)
        if (this.target.name == 'zombie') {
            this.charges -= 0.5
        } else {
            this.charges--
        }

        // if (!this.nextTarget || distSquared(this.target.pos, this.nextTarget.pos) > sqr(this.range)) {
        //     this.isDone = true
        //     return
        // }

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

        this.target = this.nextTarget
    }
}