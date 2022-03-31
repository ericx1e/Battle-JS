function Archer(x, y, arrows) {
    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.size = width / 100
    this.speed = this.size / 10;
    this.target = this
    this.hitpoints = 50
    this.attackPower = 0
    this.attackSpeed = 80 //number of frames between attacks
    this.attackRange = this.size * 25
    this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

    this.takingDamageFrames = 0 //animation for getting hit

    this.isDead = false

    this.show = function (color) {
        push()
        translate(this.pos.x, this.pos.y)
        drawSettings(color)
        rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
        line(this.size / 2, -this.size / 1.5, this.size / 2, this.size / 1.5)
        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }
        pop()
    }

    this.update = function (allies, foes) {
        if (foes.length == 0) {
            this.target = this
            return
        }

        this.target = foes[0]
        foes.forEach(foe => {
            if (distSquared(this.pos.x, this.pos.y, foe.pos.x, foe.pos.y) < distSquared(this.pos.x, this.pos.y, this.target.pos.x, this.target.pos.y)) {
                this.target = foe
            }
        })

        this.move(allies.concat(foes))
        if (distSquared(this.pos.x, this.pos.y, this.target.pos.x, this.target.pos.y) < this.attackRange * this.attackRange) {
            if ((frameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack();
            }
            // this.checkCollision(allies.concat(foes))
        }
    }

    this.attack = function () {
        arrows.push(new Arrow(this.x + this.size / 2 * cos(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x)), this.y + this.size / 2 * sin(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))))
    }

    this.takeDamage = function (damage) {
        console.log(damage)
        this.hitpoints -= damage
        this.takingDamageFrames = 20;
        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }

    this.move = function (others) {
        if (distSquared(this.pos.x, this.pos.y, this.target.pos.x, this.target.pos.y) > (this.attackRange * this.attackRange) * (0.95 * 0.95)) {
            this.vel = p5.Vector.sub(this.target.pos, this.pos).limit(this.speed)
            // stroke(255)
            // line(this.pos.x, this.pos.y, this.pos.x + this.vel.x * 15, this.pos.y + this.vel.y * 15);
            this.pos.add(this.vel)
        }
        this.checkCollision(others)
        // if (this.isColliding(others)) {
        //     this.pos.sub(this.vel.mult(random(0.5, 3)))
        // }
    }

    this.checkCollision = function (others) {
        let squeezeVel = createVector(0, 0)
        for (let i = 0; i < others.length; i++) {
            other = others[i];
            if (other == this) {
                continue
            }
            let minDist = this.size / 2 + other.size / 2
            if (distSquared(this.pos.x, this.pos.y, other.pos.x, other.pos.y) < minDist * minDist) {
                let moveVector = p5.Vector.sub(this.pos, other.pos).limit(this.speed * 0.5)
                squeezeVel.add(moveVector)
                other.pos.sub(moveVector)
            }
        }
        this.pos.add(squeezeVel)
    }
}