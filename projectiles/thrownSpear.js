function ThrownSpear(start, target, team) {
    this.pos = createVector(start.x, start.y)
    this.size = width / 100
    this.speed = this.size * .9
    this.vel = p5.Vector.sub(target, this.pos).limit(this.speed)
    this.vel.rotate(random(-0.05, 0.05))
    this.rotation = atan2(this.vel.y, this.vel.x)
    let drawVec = createVector(this.vel.x, this.vel.y).setMag(this.size)
    this.pos.add(p5.Vector.mult(drawVec, 2))
    this.damage = 50
    this.hit = []
    // this.pierce = 5

    // thrown THROUGH the mark: the javelin is aimed past its target, skewers
    // everything along the lane (flat pierce with decaying damage), and comes
    // down planted in the earth at the end of its cast. the hop is visual-only
    // and shallow, so mid-flight hits still read fine.
    const castRange = dist(start.x, start.y, target.x, target.y) * 1.45
    this._flown = 0
    this._hopT = max(1, castRange / this.speed)
    this._hopMax = min(castRange * 0.035, width / 90) // a javelin's flat trajectory, not an arrow's arc
    this._z = 0

    this.show = function () {
        // spent javelin planted in the ground: fletching skyward, fading away
        if (this.stuckFrames !== undefined) {
            push()
            translate(this.pos.x, this.pos.y)
            rotate(this._groundRot !== undefined ? this._groundRot : this.rotation)
            drawSettings(team, 200 * this.stuckFrames / 25)
            line(0, 0, -this.size * 2, 0) // shaft out of the ground
            let tailS = this.size / 6
            line(-this.size * 2, 0, -this.size * 2 - tailS, tailS)
            line(-this.size * 2, 0, -this.size * 2 - tailS, -tailS)
            pop()
            return
        }
        // shadow tracks the ground beneath the throw
        noStroke()
        fill(0, 80)
        ellipse(this.pos.x, this.pos.y, this.size * 1.3, this.size * 0.45)

        // pitch with the hop: tail-down going up, tip-down coming down
        const s = this._flown / this._hopT
        const zVel = s < 1 ? this._hopMax * 4 * (1 - 2 * s) / this._hopT : 0
        drawSettings(team)
        push()
        translate(this.pos.x, this.pos.y - bodyLift(width / 100) - this._z) // rides the standing plane
        rotate(atan2(this.vel.y - zVel, this.vel.x))
        this.drawSpear(0, 0, team)
        /*
        line(-this.size * 5, 0, 0, 0)
        push()
        // translate(-this.size * 5, 0)
        let tipS = this.size / 2
        beginShape()
        vertex(0, tipS / 2)
        vertex(tipS, tipS / 2 * 3 / 4)
        vertex(3 * tipS, 0)
        vertex(tipS, -tipS / 2 * 3 / 4)
        vertex(0, -tipS / 2)
        vertex(0, tipS / 2)
        endShape()
        pop()
        */
        pop()
    }

    this.drawSpear = function (x, y, team, tranparency) {
        push()
        translate(x, y)
        drawSettings(team, tranparency, this.size)
        push()
        translate(this.size * 1.2, 0)
        line(-this.size * 1.5, 0, 0, 0)
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
    }

    this.move = function () {
        if (this.stuckFrames !== undefined) {
            return --this.stuckFrames <= 0
        }

        this.pos.add(this.vel)
        this._flown++
        const s = this._flown / this._hopT
        this._z = s < 1 ? this._hopMax * 4 * s * (1 - s) : 0

        // the cast is spent — or too many bodies bled its force — and the
        // javelin falls to earth, planted where it stops
        if (s >= 1 || this.vel.mag() <= this.speed / 5) {
            this.stuckFrames = 25
            this._z = 0
            const zVelEnd = this._hopMax * 4 * (1 - 2 * min(s, 1)) / this._hopT
            this._groundRot = atan2(this.vel.y - zVelEnd, this.vel.x)
            return false
        }

        let targetTeam = team == 'blue' ? 'red' : 'blue'
        let collided = checkTeamCollision(this.pos, this.size / 2, targetTeam)
        if (collided.length) {
            other = collided[0]
            if (other.blocksProjectiles && isFrontal(other, { x: other.pos.x - this.vel.x, y: other.pos.y - this.vel.y })) {
                other.blockedFrames = 8 // even piercing spears stop on a raised shield
                return true
            }
            if (!this.hit.includes(other) && distSquared(this.pos, other.pos) < sqr(this.size / 2 + other.size)) {
                takeDamage(other, this.damage)
                this.hit.push(other)
                other.speed = 0
                // knockbackUnit(other, targets)
                this.vel.mult(0.9)
                this.damage = this.damage * 0.9
                // let moveVector = p5.Vector.sub(other.pos, this.pos).setMag(other.speed * 2)
                // other.pos.add(moveVector)
                // other.speed = -other.maxSpeed
                if (other.name == 'castlewall') {
                    return true
                }
            }
        }
        if (this.pos.x - this.size < 0 || this.pos.x + this.size > width || this.pos.y - this.size < 0 || this.pos.y + this.size > height) {
            return true
        }
    }
}