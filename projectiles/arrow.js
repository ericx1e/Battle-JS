function Arrow(start, target, team) {
    this.pos = createVector(start.x, start.y)
    this.size = width / 250
    this.speed = this.size / 0.75
    this.damage = BALANCE.archer.atk

    // ballistic flight: the arrow is LOOSED AT A LANDING POINT and arcs over
    // everything in between — only near the ground (launch and descent) can it
    // strike a body. volleys plunge into a formation's depth instead of all
    // soaking into the front rank, and a moving target can walk out from under
    // the landing spot.
    const tPos = target.pos || target
    const aim = createVector(tPos.x, tPos.y)
    // imperfect lead on a marching target (kiting never stamps a heading, so
    // backpedalers aren't led — dodging stays viable)
    if (target.vel && target._headingFrame >= frameCount - 1) {
        const t0 = dist(this.pos.x, this.pos.y, aim.x, aim.y) / this.speed
        aim.add(createVector(target.vel.x, target.vel.y).mult(t0 * 0.8))
    }
    // landing spread: a tight volley, not a laser — angular scatter would fan
    // out with range, but a trained archer's miss lands NEAR the mark
    const spread = min(width / 120, dist(this.pos.x, this.pos.y, aim.x, aim.y) * 0.03)
    const sAng = random(TWO_PI), sMag = spread * sqrt(random(1))
    aim.add(createVector(cos(sAng) * sMag, sin(sAng) * sMag))
    const flight = p5.Vector.sub(aim, this.pos)
    this.rotation = atan2(flight.y, flight.x)
    this.pos.add(createVector(flight.x, flight.y).setMag(this.size * 2)) // clears the bow
    const flightDist = flight.mag() - this.size * 2
    this.totalFrames = max(1, flightDist / this.speed)
    this.vel = flight.limit(this.speed)

    this.framesFlown = 0
    this.z = 0                                     // height above the field
    this.zMax = min(flightDist * 0.2, width / 10)  // point-blank shots stay flat
    this.clearance = width / 100                   // below one body height, it can hit
    this.trail = []                                // recent SCREEN positions — the trail bends with the arc

    this.show = function () {
        // spent arrow planted in the ground: fletching skyward, fading away
        if (this.stuckFrames !== undefined) {
            push()
            translate(this.pos.x, this.pos.y)
            rotate(this._groundRot !== undefined ? this._groundRot : this.rotation)
            drawSettings(team, 200 * this.stuckFrames / 25)
            line(0, 0, -this.size * 1.4, 0) // shaft out of the ground
            let tailS = this.size / 8
            line(-this.size * 1.4, 0, -this.size * 1.4 - tailS, tailS)
            line(-this.size * 1.4, 0, -this.size * 1.4 - tailS, -tailS)
            pop()
            return
        }

        // shadow tracks the true ground position; it thins and fades as the
        // arrow climbs — the widening gap to the arrow IS the height cue.
        // (strong alpha: the field is dark, a faint black shadow vanishes)
        const hs = this.zMax > 0 ? this.z / this.zMax : 0
        noStroke()
        fill(0, 110 - 50 * hs)
        ellipse(this.pos.x, this.pos.y, this.size * 1.6, this.size * (0.9 - 0.35 * hs))

        // flight rides the STANDING plane: loosed at body height, landing at
        // body height — troops are drawn lifted by the same amount
        const lift = this.z + bodyLift(width / 100)
        const grow = 1 + this.z / (width / 15) // subtly larger at the apex

        // trail: a fading ribbon through the last few screen positions, so it
        // CURVES with the flight instead of pointing flatly backwards
        for (let i = 1; i < this.trail.length; i++) {
            const k = i / this.trail.length
            if (team == 'red') stroke(255, 150, 150, 110 * k)
            else stroke(150, 150, 255, 110 * k)
            strokeWeight(this.size / 4 * k)
            line(this.trail[i - 1].x, this.trail[i - 1].y, this.trail[i].x, this.trail[i].y)
        }

        // pitch the arrow along its SCREEN velocity: nose up while climbing,
        // level over the apex, plunging nose-first on the descent
        const s = this.framesFlown / this.totalFrames
        const zVel = this.zMax * 4 * (1 - 2 * s) / this.totalFrames
        const screenRot = atan2(this.vel.y - zVel, this.vel.x)

        drawSettings(team)
        push()
        translate(this.pos.x, this.pos.y - lift)
        scale(grow)
        rotate(screenRot)
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
    }

    this.move = function () {
        if (this.stuckFrames !== undefined) {
            return --this.stuckFrames <= 0
        }

        this.pos.add(this.vel)
        this.framesFlown++
        const s = this.framesFlown / this.totalFrames
        this.z = this.zMax * 4 * s * (1 - s)
        this.trail.push({ x: this.pos.x, y: this.pos.y - this.z - bodyLift(width / 100) })
        if (this.trail.length > 9) this.trail.shift()

        // high overhead, the arrow clears bodies, shields, and walls alike
        if (this.z < this.clearance) {
            let targetTeam = team == 'blue' ? 'red' : 'blue'
            let collided = checkTeamCollision(this.pos, this.size / 2, targetTeam)
            if (collided.length) {
                let other = collided[0]
                // judge by flight direction: an arrow flying into the shield's face
                // is caught — a raised shield catches the plunging ones too
                if (other.blocksProjectiles && isFrontal(other, { x: other.pos.x - this.vel.x, y: other.pos.y - this.vel.y })) {
                    other.blockedFrames = 8 // plink — caught on the shield
                    return true
                }
                takeDamage(other, this.damage)
                return true
            }
            for (let i = 0; i < walls.length; i++) {
                wall = walls[i]
                if (distSquared(this.pos, wall.pos) < sqr(this.size / 2 + wall.r)) {
                    return true
                }
            }
        }

        // spent: stick in the ground where it fell, planted at its final
        // screen pitch (steeply nose-down after a long arc)
        if (s >= 1) {
            this.stuckFrames = 25
            this.z = 0
            const zVelEnd = this.zMax * 4 * (1 - 2 * s) / this.totalFrames
            this._groundRot = atan2(this.vel.y - zVelEnd, this.vel.x)
            return false
        }

        if (this.pos.x - this.size < 0 || this.pos.x + this.size > width || this.pos.y - this.size < 0 || this.pos.y + this.size > height) {
            return true
        }
    }
}
