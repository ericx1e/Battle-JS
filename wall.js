function Wall(x, y, r) {
    this.pos = createVector(x, y)
    this.r = r

    this.show = function () {
        push()
        translate(this.pos.x, this.pos.y)
        fill(120, 120)
        noStroke()
        ellipse(0, 0, 2 * this.r)
        pop()
    }

    this.update = function () {
        collided = checkCollision(this.pos, this.r)
        collided.forEach(unit => {
            let minDist = this.r + unit.size / 2;
            if (distSquared(this.pos, unit.pos) < sqr(minDist)) {
                let moveVector = p5.Vector.sub(this.pos, unit.pos).limit(2 * unit.maxSpeed)
                unit.pos.sub(moveVector)
            }
        });
    }
}