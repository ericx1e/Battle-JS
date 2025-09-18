function CastleWall(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'wall'
        this.team = team
        this.cost = 100
        this.projectiles = team == 'red' ? redProjectiles : blueProjectiles

        this.vel = createVector(0, 0)
        this.size = width / 20
        this.troopSize = width / 100
        this.speed = 0;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = 1000
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = 0
        this.attackSpeed = 80 //number of frames between attacks
        this.attackRange = this.size * 40
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.takingDamageFrames = 0 //animation for getting hit

        this.isDead = false
    }

    this.reset()

    this.show = function (tranparency) {
        push()
        translate(this.pos.x, this.pos.y)

        if (healthBars) {
            strokeWeight(this.size / 5)
            stroke(150)
            line(-this.size, -this.size, this.size, -this.size)
            colorMode(HSB, this.maxHitpoints, 255, 255, 255)
            stroke(30 * this.hitpoints / this.maxHitpoints, 255, 255)
            line(-this.size, -this.size, -this.size + 2 * this.size * this.hitpoints / this.maxHitpoints, -this.size)
        }

        drawSettings(team, tranparency, this.size)
        noStroke()
        rectMode(CENTER)
        rect(0, 0, this.size)
        let offset = this.size / 3
        for (let i = 0; i < 3; i++) {
            rect(-this.size / 2 + this.size / 8, (i - 1) * offset, this.size / 4, this.size / 4)
            rect(this.size / 2 - this.size / 8, (i - 1) * offset, this.size / 4, this.size / 4)
        }
        noFill()
        drawSettings(team, tranparency, this.troopSize)
        arc(0, 0, this.troopSize, this.troopSize, PI / 2 - PI * this.hitpoints / this.maxHitpoints, PI / 2 + PI * this.hitpoints / this.maxHitpoints, OPEN)
        rotate(atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x))
        drawSettings(team, tranparency, this.troopSize)
        noStroke()
        ellipse(0, 0, this.troopSize - this.troopSize * this.takingDamageFrames / 100, this.troopSize - this.troopSize * this.takingDamageFrames / 100)
        drawSettings(team, tranparency, this.troopSize)
        noFill();
        beginShape();
        vertex(this.troopSize / 2, -this.troopSize / 1.2);
        vertex(this.troopSize / 2, this.troopSize / 1.2);
        vertex(this.troopSize / 1.4, this.troopSize / 3.5);
        vertex(this.troopSize / 1.4, -this.troopSize / 3.5);
        vertex(this.troopSize / 2, -this.troopSize / 1.2);
        endShape();
        // quad(this.size / 2, -this.size / 1.2, this.size / 2, this.size / 1.2, this.size / 1.5, this.size / 3, this.size / 1.5, -this.size / 3);

        // sphere(this.size / 2)
        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }

        pop()
    }

    this.update = function (allies, foes) {
        if (this.isDead) return

        if (foes.length == 0) {
            this.target = this
            return
        }

        if (this.speed < this.maxSpeed) {
            this.speed += this.maxSpeed / 100
        }

        updateTarget(this, foes)

        // moveUnit(this)
        if (distSquared(this.pos, this.target.pos) < sqr(this.attackRange)) {
            if ((battleFrameCount - this.firstAttackFrame) % this.attackSpeed == 0) {
                this.attack();
            }
            // this.checkCollision(allies.concat(foes))
        }

        // this.hitpoints = lerp1(this.hitpoints, this.targetHitpoints, 0.1)

        if (this.hitpoints <= 0) {
            this.isDead = true
        }
    }


    this.attack = function () {
        this.projectiles.push(new Arrow(this.pos, this.target.pos, team))
    }
}