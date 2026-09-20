function FWizard(x, y, team) {
    this.pos = createVector(x, y)
    this.reset = function () {
        this.name = 'fwizard'
        this.team = team
        this.cost = BALANCE.fwizard.cost
        this.projectiles = team == 'red' ? redProjectiles : blueProjectiles

        this.vel = createVector(0, 0)
        this.size = width / 100
        this.speed = this.size / 15;
        this.maxSpeed = this.speed;
        this.target = this
        this.maxHitpoints = BALANCE.fwizard.hp
        this.hitpoints = this.maxHitpoints
        this.targetHitpoints = this.hitpoints
        this.attackPower = BALANCE.fwizard.atk
        this.attackSpeed = BALANCE.fwizard.period //number of frames between attacks
        this.attackRange = this.size * 25
        this.firstAttackFrame = parseInt(random(0, this.attackSpeed))

        this.takingDamageFrames = 0 //animation for getting hit

        this.isDead = false
    }

    this.reset()

    let particles = []
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
        drawSettings(team, tranparency, this.size)
        noStroke()
        ellipse(0, 0, this.size - this.size * this.takingDamageFrames / 100, this.size - this.size * this.takingDamageFrames / 100)
        drawSettings(team, tranparency, this.size)
        noFill();

        noFill();
        line(this.size / 2, this.size / 3, this.size / 2, -this.size / 2)
        let s = this.size / 3
        ellipse(this.size / 2, -this.size / 2 - s / 2, s * 1.5)

        if (frameCount % 5 == 0) {
            particles.push({ h: random(100, 150), a: 255, x: this.size / 2, y: -this.size / 2 - s / 2, vx: random(-0.15, 0.15), vy: random(-0.5, -1.0) })
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            push()
            // colorMode(HSB)
            fill(p.a, p.h, 0, p.a)
            noStroke()
            // drawingContext.shadowColor = 'rgba(255, 183, 0, 1)';
            // drawingContext.shadowBlur = p.a / 25;
            ellipse(p.x, p.y, map(p.a, 255, 0, this.size / 3, 0));
            pop()

            p.a -= 5
            p.x += p.vx; p.y += p.vy;


            if (p.a <= 0) {
                particles.splice(i, 1);
            }
        }

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

        if (!rangedKite(this)) {
            moveUnit(this)
        }
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
        spawnRing(this.pos.x, this.pos.y, team, this.size * 2)
        let fireball = new Fireball(this.pos, this.target.pos, team)
        fireball.damage *= this.dmgMult || 1
        this.projectiles.push(fireball)
    }
}