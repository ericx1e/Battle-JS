function Soldier(x, y) {
    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.size = width / 100
    this.speed = this.size / 10;
    this.target = this
    this.hitpoints = 100
    this.attackPower = 10
    this.attackSpeed = 80 //number of frames between attacks
    this.attackRange = this.size
    this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

    this.takingDamageFrames = 0 //animation for getting hit

    this.isDead = false

    this.show = function (color) {
        push()
        translate(this.pos.x, this.pos.y)
        drawSettings(color)
        rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
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

        if (distSquared(this.pos.x, this.pos.y, this.target.pos.x, this.target.pos.y) < this.attackRange * this.attackRange) {
            if ((frameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack();
            }
        } else {
            this.move(allies.concat(foes))
        }

    }

    this.attack = function () {
        this.target.takeDamage(this.attackPower)
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
        this.vel = p5.Vector.sub(this.target.pos, this.pos).limit(this.speed)
        // stroke(255)
        // line(this.pos.x, this.pos.y, this.pos.x + this.vel.x * 15, this.pos.y + this.vel.y * 15);
        this.pos.add(this.vel)
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
                squeezeVel.add(p5.Vector.sub(this.pos, other.pos).limit(this.speed * random(1, 1.5)))
            }
        }
        this.pos.add(squeezeVel)
    }
}