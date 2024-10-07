function Button(x, y, w, h, id) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.model

    let modelX = this.x
    let modelY = this.y
    let modelTeam = 'red'

    switch (id) {
        case 'soldier':
            this.model = new Soldier(modelX, modelY, modelTeam)
            break
        case 'archer':
            this.model = new Archer(modelX, modelY, modelTeam)
            break
        case 'spear':
            this.model = new Spear(modelX, modelY, modelTeam)
            break
        case 'necromancer':
            this.model = new Necromancer(modelX, modelY, modelTeam)
            break
        case 'summoner':
            this.model = new Summoner(modelX, modelY, modelTeam)
            break
        case 'ewizard':
            this.model = new EWizard(modelX, modelY, modelTeam)
            break
        case 'shield':
            this.model = new Shield(modelX, modelY, modelTeam)
            break
        case 'healer':
            this.model = new Healer(modelX, modelY, modelTeam)
            break
        case 'reaper':
            this.model = new Reaper(modelX, modelY, modelTeam)
            break
        case 'wall':
            this.model = new Wall(modelX, modelY, modelTeam)
            break
        case 'shop_refresh':
            this.shopCost = 1
            break
        case 'shop_soldier':
            this.model = new Soldier(modelX, modelY, modelTeam)
            this.model.size *= 2
            this.shopCost = 2
            break
        case 'shop_archer':
            this.model = new Archer(modelX, modelY, modelTeam)
            this.model.size *= 2
            this.shopCost = 3
            break
        case 'shop_shield':
            this.model = new Shield(modelX, modelY, modelTeam)
            this.model.size *= 2
            this.shopCost = 2
            break
        case 'shop_zombie':
            this.model = new Zombie(modelX, modelY, modelTeam)
            this.model.size *= 2
            this.shopCost = 3
            break
        case 'shop_soldier_health':
            this.model = new Soldier(modelX, modelY, modelTeam)
            this.model.size *= 2
            this.shopCost = 4
            break
        case 'shop_archer_spread':
            this.model = new Archer(modelX, modelY, modelTeam)
            this.model.size *= 2
            this.shopCost = 5
            break
    }

    this.show = function () {
        rectMode(CENTER)
        noStroke()

        let coinS = w / 4

        if (this.model) {
            if (this.isTouchingMouse()) {
                if (menuOpen) {
                    this.extraInfo(id)
                } else if (mode == 'autochess') {
                    // this.extraInfo(id) //TODO
                }
                fill(230)
            } else {
                fill(255)
            }
            rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
            this.model.show()

            if (mode == 'autochess') {
                switch (id) {
                    case 'shop_soldier_health':
                        noStroke()
                        fill(50, 230, 50)
                        textSize(this.w / 2)
                        textAlign(CENTER, CENTER)
                        text('+', this.x + this.model.size / 2, this.y - this.model.size / 2)
                        break
                    case 'shop_archer_spread':
                        noStroke()
                        fill(50, 230, 50)
                        textSize(this.w / 4)
                        textAlign(CENTER, CENTER)
                        text('x3', this.x + this.model.size, this.y - this.model.size)
                        break
                }
            }

            if (this.shopCost) {
                drawCoin(x + w / 2 - coinS, y + h / 2 - coinS, coinS, this.shopCost)
            }
        } else if (id.includes('level')) {
            let n = parseInt(id.substring(5)) //Any text after 'level'
            let level = levels[n]
            if (level.locked) {
                fill(120)
            } else {
                if (level.complete) {
                    if (this.isTouchingMouse()) {
                        fill(190, 220, 190)
                    } else {
                        fill(195, 245, 195)
                    }
                } else {
                    if (this.isTouchingMouse()) {
                        fill(230)
                    } else {
                        fill(255)
                    }
                }
            }
            rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
            fill(0)
            textAlign(CENTER, CENTER)
            textSize(this.h / 4)
            text(n + 1, this.x, this.y)
        } else {
            switch (id) {
                case 'title_sandbox':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('Sandbox', this.x, this.y)
                    break
                case 'title_autochess':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('Autochess', this.x, this.y)
                    break
                case 'title_campaign':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('Campaign', this.x, this.y)
                    break
                case 'title_versus':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('Versus', this.x, this.y)
                    break
                case 'versus_join':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('Join', this.x, this.y)
                    break
                case 'return_to_title':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('return to title', this.x, this.y)
                    break
                case 'start':
                    let tx;
                    if (battling) {
                        if (this.isTouchingMouse()) {
                            fill(230, 120, 120)
                        } else {
                            fill(255, 130, 130)
                        }
                        tx = 'stop'
                    } else {
                        if (this.isTouchingMouse()) {
                            fill(120, 230, 120)
                        } else {
                            fill(130, 255, 130)
                        }
                        tx = 'start'
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text(tx, this.x, this.y)
                    break
                case 'rand_all':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('random', this.x, this.y)
                    break
                case 'rand_red':
                    if (this.isTouchingMouse()) {
                        fill(185, 140, 140)
                    } else {
                        fill(210, 160, 160)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('random', this.x, this.y)
                    break
                case 'rand_blue':
                    if (this.isTouchingMouse()) {
                        fill(140, 140, 185)
                    } else {
                        fill(160, 160, 210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('random', this.x, this.y)
                    break
                case 'erase':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text(id, this.x, this.y)
                    break
                case 'clear':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text(id, this.x, this.y)
                    break
                case 'restart':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text(id, this.x, this.y)
                    break
                case 'shop_refresh':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('refresh', this.x, this.y)
                    drawCoin(x + w / 2 - coinS, y + h / 2 - coinS, coinS, this.shopCost)
                    break
            }
        }
    }

    this.onClick = function () {
        if (this.isTouchingMouse()) {
            erasing = false
            if (this.model) {
                if (mode == 'autochess') {
                    if (this.shopCost && autochessEngine.gold >= this.shopCost) {
                        switch (id) {
                            case 'shop_soldier':
                                redTroops.push(new Soldier(width / 4 + random(-1, 1), height / 2 + random(-1, 1), 'red'))
                                autochessEngine.gold -= this.shopCost
                                break
                            case 'shop_archer':
                                redTroops.push(new Archer(width / 4 + random(-1, 1), height / 2 + random(-1, 1), 'red'))
                                autochessEngine.gold -= this.shopCost
                                break
                            case 'shop_shield':
                                redTroops.push(new Shield(width / 4 + random(-1, 1), height / 2 + random(-1, 1), 'red'))
                                autochessEngine.gold -= this.shopCost
                                break
                            case 'shop_zombie':
                                for (let i = 0; i < 6; i++) {
                                    redTroops.push(new Zombie(width / 4 + random(-1, 1), height / 2 + random(-1, 1), 'red'))
                                }
                                autochessEngine.gold -= this.shopCost
                                break
                            case 'shop_soldier_health':
                                autochessEngine.buffs.push('soldier_health')
                                autochessEngine.gold -= this.shopCost
                                break
                            case 'shop_archer_spread':
                                autochessEngine.buffs.push('archer_spread')
                                autochessEngine.gold -= this.shopCost
                                break
                        }
                        return true
                    }
                } else {
                    newTroopId = id;
                }
            } else if (id.includes('level')) {
                let n = parseInt(id.substring(5)) //Any text after 'level'
                let level = levels[n]
                if (level.locked) return
                level.load()
            } else {
                newTroopId = undefined
                switch (id) {
                    case 'title_campaign':
                        mode = 'campaign'
                        changeScreen('level_select')
                        break
                    case 'title_autochess':
                        mode = 'autochess'
                        changeScreen('game')
                        break
                    case 'title_sandbox':
                        mode = 'sandbox'
                        changeScreen('game')
                        break
                    case 'title_versus':
                        mode = 'versus'
                        changeScreen('versus_lobby')
                        break
                    case 'versus_join':
                        changeScreen('versus_loading')
                        room = lobbyName
                        console.log("room:", room);
                        mode = 'sandbox'

                        if (room) {
                            partyConnect(
                                "wss://p5partyserver.herokuapp.com/",
                                "select_room",
                                room,
                                changeScreen('game')
                            );

                            shared = partyLoadShared("shared", { redTroops: [], blueTroops: [], battling: false, battleFrameCount: 0 });
                            my = partyLoadMyShared();
                            guests = partyLoadGuestShareds();
                        }
                        break
                    case 'return_to_title':
                        changeScreen('title')
                        break
                    case 'start':
                        battling = !battling
                        switch (mode) {
                            case 'campaign':
                                currentLevel.started = true
                                menuOpen = false
                                break
                            case 'autochess':
                                if (autochessEngine.status == 'preparing') {
                                    autochessEngine.savedTroops = redTroops.map((troop) => { troop.reset(); return troop }) // copy array
                                    autochessEngine.savedPositions = redTroops.map((troop) => createVector(troop.pos.x, troop.pos.y))
                                    // autochessEngine.savedTroops = redTroops.map((troop) => troop)
                                    autochessEngine.status = 'battling'
                                    randomTroops('blue', autochessEngine.stage)
                                    console.log(blueTroops)
                                }
                                break
                        }
                        break
                    case 'rand_all':
                        randomTroops('red')
                        randomTroops('blue')
                        break
                    case 'rand_red':
                        randomTroops('red')
                        break
                    case 'rand_blue':
                        randomTroops('blue')
                        break
                    case 'clear':
                        if (mode == 'sandbox') {
                            clearTroops()
                        } else {
                            clearTroops('red')
                        }
                        break
                    case 'erase':
                        erasing = true
                        newTroopId = undefined
                        break
                    case 'restart':
                        currentLevel.load()
                        break
                    case 'shop_refresh':
                        if (autochessEngine.gold >= this.shopCost) {
                            autochessEngine.gold -= this.shopCost
                            autochessEngine.generateShop()
                        }
                        break
                }
            }
        }
    }

    this.extraInfo = function (id) {
        rectMode(CENTER)
        let w = width / 6
        let h = width / 3
        let x = menu.x + menu.w + w / 2 + w / 15
        let y = h / 2 + w / 15
        fill(240)
        rect(x, y, w, h, w / 15)

        fill(0)
        textSize(width / 50)
        textAlign(CENTER, TOP)
        textWrap(WORD);

        let titleY = y - h / 2.1
        let descY = y - h / 2.6

        let title
        let description

        switch (id) {
            case 'soldier':
                title = 'Soldier'
                description = 'Simple and efficent warriors ready for any battle'
                break
            case 'archer':
                title = 'Archer'
                description = 'Though slower and weaker than most, they can quick defeat their enemies from a distance'
                break
            case 'necromancer':
                title = 'Necromancer'
                description = 'Masters of the dead, collecting souls of fallen allies to bring them back to life as a zombie'
                break
            case 'summoner':
                title = 'Summoner'
                description = 'Summons weak zombies to aid in battle'
                break
            case 'ewizard':
                title = 'Electric Wizard'
                description = 'Fires bolts of powerful lightning that arc across troops, stunning them'
                break
            case 'shield':
                title = 'Shield'
                description = 'Extremely tough units capable of pushing foes away to maintain a strong front line'
                break
            case 'healer':
                title = 'Healer'
                description = 'Heals allies in an area around them'
                break
            case 'reaper':
                title = 'Reaper'
                description = 'Tough and fast demons that deal damage in an area around them and heal with each takedown'
                break
            case 'spear':
                title = 'Spear'
                description = 'Long range melee units with a few thrown spears that pierce enemies'
                break
        }

        switch (id) {
            case 'shop_soldier':
                title = 'Summon Soldier'
                description = 'Summoners a soldier'
                break
        }

        if (title && description) {
            if (mode == 'autochess') {
                text(title, mouseX, mouseY)
                textSize(width / 75)
                text(description, mouseX, mouseY, w)
                fill(100, 150, 100)
            } else {
                text(title, x, titleY)
                textSize(width / 75)
                text(description, x, descY, w)
                fill(100, 150, 100)
                text('$' + this.model.cost, x, h - titleY)
            }
        }
    }

    this.isTouchingMouse = function () {
        return mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 && mouseY > this.y - this.h / 2 && mouseY < this.y + this.h / 2
    }
}