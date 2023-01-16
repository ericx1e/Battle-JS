function Level(n) {
    this.n = n
    this.complete = false
    this.locked = false
    let budgets = [50, 70, 250, 700, 300, 300]
    this.budget = budgets[n]
    this.money = this.budget
    this.started = false

    let status = 'none'

    this.load = function () {
        changeScreen('game')
        currentLevel = this
        this.started = false
        this.money = this.budget
        status = 'none'
        clearTroops()
        let troops = blueTroops
        let team = 'blue'
        let offset = width / 2
        switch (n) {
            case 0:
                for (let i = 0; i < 6; i++) {
                    troops.push(new Soldier(offset + width / 8 + width / 16 * i, height / 2, team))
                }
                break
            case 1:
                for (let i = 0; i < 5; i++) {
                    troops.push(new Soldier(offset + width / 12, height / 2.5 + i * width / 32, team))
                }
                for (let i = 0; i < 3; i++) {
                    troops.push(new Archer(offset + width / 6, height / 12 + i * width / 32, team))
                }
                break
            case 2:
                for (let i = 0; i < 10; i++) {
                    troops.push(new Soldier(offset + width / 12, height / 2 + (i - 5) * width / 32, team))
                }
                for (let i = 0; i < 16; i++) {
                    troops.push(new Soldier(offset + width / 24, height / 2 + (i - 8) * width / 32, team))
                }
                for (let i = 0; i < 10; i++) {
                    troops.push(new Soldier(offset + width / 8, height / 2 + (i - 5) * width / 32, team))
                }
            case 3:
                for (let i = 0; i < 16; i++) {
                    troops.push(new Soldier(offset + width / 12, height / 2 + (i - 8) * width / 32, team))
                }
                for (let i = 0; i < 16; i++) {
                    troops.push(new Soldier(offset + width / 24, height / 2 + (i - 8) * width / 32, team))
                }
                for (let i = 0; i < 16; i++) {
                    troops.push(new Soldier(offset + width / 8, height / 2 + (i - 8) * width / 32, team))
                }
                for (let i = 0; i < 16; i++) {
                    troops.push(new Archer(offset + width / 3, height / 2 + (i - 8) * width / 32, team))
                }
                break
            // troops.push(new Necromancer(offset + width / 4, height / 2, team))
            // troops.push(new Summoner(offset + width / 4 + width / 16, height / 2, team))
            case 4:
                for (let i = 0; i < 10; i++) {
                    troops.push(new Summoner(offset + width / 3, height / 2 + (i - 5) * width / 32, team))
                }
                break
            case 5:
                for (let i = 0; i < 10; i++) {
                    troops.push(new Shield(offset + width / 6, height / 2 + (i - 5) * width / 32, team))
                    troops.push(new Archer(offset + width / 3, height / 2 + (i - 5) * width / 32, team))
                }
                break
        }
    }

    this.update = function () {
        if (this.started) {
            if (status == 'none') {
                if (redTroops.length == 0) {
                    battling = false
                    status = 'defeat'
                }
                if (blueTroops.length == 0) {
                    battling = false
                    status = 'victory'
                }
            }
        }
        if (status == 'defeat') {
            this.defeat()
        } else if (status == 'victory') {
            this.victory()
        }
    }

    this.defeat = function () {

        rectMode(CENTER)
        fill(200)
        rect(width / 2, height / 2, width, width / 6)
        textSize(width / 12)
        noStroke()
        fill(0)
        textAlign(CENTER, CENTER)
        text('Defeat', width / 2, height / 2)
        if (mouseIsPressed) {
            currentLevel = undefined
            changeScreen('level_select')
        }
    }

    this.victory = function () {
        this.complete = true
        if (levels[n + 1]) {
            levels[n + 1].locked = false
        }

        rectMode(CENTER)
        fill(200)
        rect(width / 2, height / 2, width, width / 6)
        textSize(width / 12)
        noStroke()
        fill(0)
        textAlign(CENTER, CENTER)
        text('Victory!', width / 2, height / 2)
        if (mouseIsPressed) {
            currentLevel = undefined
            changeScreen('level_select')
        }
    }
}