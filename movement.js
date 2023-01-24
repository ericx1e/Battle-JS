function moveUnit(unit, others) {
    if (distSquared(unit.pos, unit.target.pos) > sqr(unit.attackRange * 0.9)) {
        unit.vel = p5.Vector.sub(unit.target.pos, unit.pos).limit(unit.speed)
        unit.pos.add(unit.vel)
    }
    checkCollision(unit, others)
    checkBoundaries(unit)
    // if (this.isColliding(others)) {
    //     this.pos.sub(this.vel.mult(random(0.5, 3)))
    // }
}

function knockbackUnit(unit, others) {
    // let moveVector = p5.Vector.sub(foe.pos, this.pos).setMag(foe.speed * 2)
    // foe.pos.add(moveVector)
    unit.pos.add(p5.Vector.mult(unit.vel, -2))
    unit.speed = -unit.maxSpeed / 2
    moveUnit(unit, others)
}

function moveUnitTowards(unit, dest, others) {
    if (distSquared(unit.pos, dest) > sqr(unit.attackRange * 0.9)) {
        unit.vel = p5.Vector.sub(dest, unit.pos).limit(unit.speed)
        unit.pos.add(unit.vel)
    }
    checkCollision(unit, others)
    checkBoundaries(unit)
}

function checkCollision(unit, others) {
    let squeezeVel = createVector(0, 0)
    for (let i = 0; i < others.length; i++) {
        other = others[i];
        if (other.isDead) continue
        if (other == unit) {
            continue
        }
        let minDist = unit.size / 2 + other.size / 2
        if (distSquared(unit.pos, other.pos) < sqr(minDist)) {
            let moveVector = p5.Vector.sub(unit.pos, other.pos).limit(unit.maxSpeed * random(0.4, 0.5))
            squeezeVel.add(moveVector)
            other.pos.sub(moveVector)
        }
    }
    unit.pos.add(squeezeVel)
}

function checkBoundaries(unit) {
    if (unit.pos.x > width) {
        unit.pos.add(createVector(-unit.size / 2, 0))
    }
    if (unit.pos.x < 0) {
        unit.pos.add(createVector(unit.size / 2, 0))
    }
    if (unit.pos.y > height) {
        unit.pos.add(createVector(0, -unit.size / 2))
    }
    if (unit.pos.y < 0) {
        unit.pos.add(createVector(0, unit.size / 2))
    }
}