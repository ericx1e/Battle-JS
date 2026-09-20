function Zombie(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'zombie'
        this.team = team
        this.cost = BALANCE.zombie.cost
        this.vel = createVector(0, 0)
        this.size = width / 150
        this.speed = this.size / 8;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = BALANCE.zombie.hp
        this.hitpoints = 0.25
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.zombie.atk
        this.attackSpeed = BALANCE.zombie.period //number of frames between attacks
        this.attackRange = this.size * 1.5
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))
        this.spawnFrame = battleFrameCount

        this.takingDamageFrames = 0 //animation for getting hit

        this.isDead = false
    }

    this.reset()

    this.show = function (tranparency) {
        push()
        translate(this.pos.x, this.pos.y)
        if (this._shadowFrame != frameCount) drawUnitShadow(this.size) // feet on the field (battle runs a shadow pass first)
        translate(0, -bodyLift(this.size)) // the body stands above it

        if (healthBars) {
            strokeWeight(this.size / 5)
            stroke(150)
            line(-this.size, -this.size, this.size, -this.size)
            colorMode(HSB, this.maxHitpoints, 255, 255, 255)
            stroke(30 * this.hitpoints / this.maxHitpoints, 255, 255)
            line(-this.size, -this.size, -this.size + 2 * this.size * this.hitpoints / this.maxHitpoints, -this.size)
        }

        drawSettings(team, tranparency, this.size)
        noFill()
        arc(0, 0, this.size, this.size, PI / 2 - PI * this.hitpoints / this.maxHitpoints, PI / 2 + PI * this.hitpoints / this.maxHitpoints, OPEN)
        rotate(unitFacing(this))
        // a hungry lurch forward with every bite
        if (this.lunge > 0) {
            translate(this.size * 0.3 * this.lunge / 6, 0)
            this.lunge--
        }
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
        // sphere(this.size / 2)
        if (this.takingDamageFrames > 0) {
            this.takingDamageFrames--
        }

        pop()
    }

    this.update = function (allies, foes) {
        if (this.isDead) return

        if (battleFrameCount - this.spawnFrame < this.maxHitpoints * 4 - 1) {
            if (this.hitpoints <= 0) {
                this.isDead = true
            }
            this.hitpoints += 0.25
            updateTarget(this, foes)
            return
        }

        if (foes.length == 0) {
            this.target = this
            return
        }

        this.hitpoints -= BALANCE.zombie.decay // the swarm rots away over ~25s

        if (this.speed < this.maxSpeed) {
            this.speed += this.maxSpeed / 100
        }

        updateTarget(this, foes)

        moveUnit(this)
        if (distSquared(this.pos, this.target.pos) < sqr(this.attackRange + reachBonus(this.target))) {
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
        this.lunge = 6
        takeDamage(this.target, this.attackPower, this)
    }
}