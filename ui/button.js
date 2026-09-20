function Button(x, y, w, h, id) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.model

    let modelX = this.x
    let modelY = this.y
    let modelTeam = 'red'

    if (id == 'shop_refresh') {
        this.shopCost = 1
    } else if (id.startsWith('buff_')) {
        this.buffData = AUTOCHESS_BUFFS[id.substring(5)]
        this.shopCost = this.buffData ? this.buffData.price : 1 // engine overrides with the escalated price
    } else if (id.startsWith('shop_')) {
        // shop buttons: model + price both derive from balance.js
        const item = id.substring(5)
        const b = BALANCE[item]
        this.model = makeTroop(item, modelX, modelY, modelTeam)
        this.shopCost = b ? b.shopCost * (b.shopPack || 1) : 1
        if (this.model) {
            this.model.size *= 2
            this.model._uiModel = true // buttons draw the body, not auras
        }
    } else if (id == 'wall') {
        this.model = new Wall(modelX, modelY, modelTeam)
    } else {
        this.model = makeTroop(id, modelX, modelY, modelTeam) // undefined for non-troop ids
        if (this.model) {
            this.model._uiModel = true // buttons draw the body, not auras
        }
    }

    this.show = function () {
        rectMode(CENTER)
        noStroke()

        let coinS = w / 4

        if (this.model) {
            // capstone tier gets a distinct glowing frame — cost-driven, not
            // a hardcoded name, so any future capstone unit picks it up for
            // free. currently only the warlock ($100) clears the bar.
            const troopName = id.startsWith('shop_') ? id.substring(5) : id
            const troopBalance = BALANCE[troopName]
            const isCapstone = troopBalance && troopBalance.cost >= 90
            if (isCapstone) {
                noFill()
                stroke(230, 180, 90, 200 + 55 * sin(frameCount * 0.05))
                strokeWeight(this.h / 14)
                rect(this.x, this.y, this.w * 1.12, this.h * 1.12, this.h / 4.5)
                noStroke()
            }

            if (this.isTouchingMouse()) {
                if (menuOpen || mode == 'autochess') {
                    this.extraInfo(id)
                }
                fill(230)
            } else {
                fill(255)
            }
            rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
            this.model.show()

            if (mode == 'autochess' && id.startsWith('shop_')) {
                const b = BALANCE[id.substring(5)]
                if (b && b.shopPack > 1) {
                    noStroke()
                    fill(50, 230, 50)
                    textSize(this.w / 4)
                    textAlign(CENTER, CENTER)
                    text('x' + b.shopPack, this.x + this.model.size, this.y - this.model.size)
                }
            }

            if (this.shopCost) {
                let displayCost = (mode == 'autochess' && autochessEngine) ? autochessEngine.itemCost(id, this.shopCost) : this.shopCost
                drawCoin(x + w / 2 - coinS, y + h / 2 - coinS, coinS, displayCost)
            }
        } else if (this.buffData) {
            if (this.isTouchingMouse()) {
                this.extraInfo(id)
                fill(208, 233, 208)
            } else {
                fill(225, 245, 225)
            }
            rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
            fill(60, 120, 60)
            textAlign(CENTER, CENTER)
            textSize(this.h / 4)
            text(this.buffData.icon, this.x, this.y - this.h / 12)
            drawCoin(x + w / 2 - coinS, y + h / 2 - coinS, coinS, this.shopCost)
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
            if (!level.locked) {
                fill(100, 150, 100)
                textSize(this.h / 7)
                text('$' + level.budget, this.x, this.y + this.h / 3)
            }
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
                case 'title_siege':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 4)
                    text('Siege', this.x, this.y)
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
                case 'siege_repair':
                    if (siege.gold >= SIEGE_REPAIR_COST && siegeRepairTargets().length) {
                        if (this.isTouchingMouse()) {
                            fill(120, 230, 120)
                        } else {
                            fill(130, 255, 130)
                        }
                    } else {
                        fill(120, 135, 120) // nothing to repair or can't afford
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 3)
                    text('repair', this.x, this.y - this.h / 7)
                    textSize(this.h / 4.5)
                    text('-' + SIEGE_REPAIR_COST + 'g  /  +' + SIEGE_REPAIR_HP + 'hp', this.x, this.y + this.h / 4)
                    break
                case 'siege_barracks_build': {
                    const cost = barracksBuildCost()
                    const count = barracksLiving().length
                    if (siege.gold >= cost) {
                        if (this.isTouchingMouse()) fill(120, 180, 230)
                        else fill(130, 200, 255)
                    } else {
                        fill(120, 135, 150)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 3)
                    text('build barracks', this.x, this.y - this.h / 7)
                    textSize(this.h / 4.5)
                    text((count ? ('x' + count + '  ') : '') + '-' + cost + 'g', this.x, this.y + this.h / 4)
                    break
                }
                case 'siege_barracks_upgrade': {
                    const target = barracksUpgradeTarget()
                    const cost = target ? BARRACKS_TIERS[target.tier + 1].cost : null
                    if (target && siege.gold >= cost) {
                        if (this.isTouchingMouse()) fill(255, 210, 120)
                        else fill(255, 225, 150)
                    } else {
                        fill(120, 135, 150)
                    }
                    rect(this.x, this.y, this.w, this.h, this.h / 5, this.h / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.h / 3)
                    text('upgrade', this.x, this.y - this.h / 7)
                    textSize(this.h / 4.5)
                    text(target ? ('T' + target.tier + '->' + (target.tier + 1) + '  -' + cost + 'g') : 'none to upgrade', this.x, this.y + this.h / 4)
                    break
                }
            }
        }
    }

    this.onClick = function () {
        if (this.isTouchingMouse()) {
            erasing = false
            if (mode == 'autochess' && this.shopCost) {
                return autochessEngine.buyFromShop(id, this.shopCost)
            }
            if (this.model) {
                if (mode != 'autochess') {
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
                    case 'title_siege':
                        mode = 'siege'
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
                        if (mode == 'autochess') {
                            autochessEngine.startBattle()
                        } else {
                            battling = !battling
                            if (mode == 'campaign') {
                                currentLevel.started = true
                                menuOpen = false
                            }
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
                    case 'siege_repair':
                        doSiegeRepair()
                        break
                    case 'siege_barracks_build':
                        doBuildBarracks()
                        break
                    case 'siege_barracks_upgrade':
                        doUpgradeBarracks()
                        break
                }
            }
        }
    }

    this.extraInfo = function (id) {
        rectMode(CENTER)
        let w = width / 6
        let h = width / 3
        let x, y
        if (mode == 'autochess') {
            // float above the shop button being hovered
            h = width / 5
            x = constrain(this.x, w / 2, width - w / 2)
            y = this.y - this.h / 2 - h / 2 - w / 30
        } else {
            x = menu.x + menu.w + w / 2 + w / 15
            y = h / 2 + w / 15
        }
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

        // buffs describe themselves from the registry
        if (id.startsWith('buff_')) {
            const b = AUTOCHESS_BUFFS[id.substring(5)]
            if (b) {
                title = b.name
                description = b.desc
            }
        }

        // shop buttons share the base troop descriptions
        let baseId = id.startsWith('shop_') ? id.substring(5) : id

        switch (baseId) {
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
                description = 'Feeds a small zombie pack into the fight, quickly replacing them as they fall'
                break
            case 'ewizard':
                title = 'Electric Wizard'
                description = 'Fires bolts of powerful lightning that arc across troops, stunning them'
                break
            case 'fwizard':
                title = 'Fire Wizard'
                description = 'Lobs fireballs that burst and burn everything packed around the target'
                break
            case 'warlock':
                title = 'Warlock'
                description = 'A battle mage: casts a chain that lashes onto up to 3 nearby foes, yanking them in and rooting them for a beat, healing off the damage. Every few casts is a bigger, wider surge. A capstone, not a swarm piece'
                break
            case 'shield':
                title = 'Shield'
                description = 'A walking wall: arrows and spears bounce off its front, and it shoves foes back. Magic burns right through'
                break
            case 'charger':
                title = 'Charger'
                description = 'Shock cavalry: a full-gallop lance impact deals massive damage — and if it kills, the charge rolls on into the next victim'
                break
            case 'reaver':
                title = 'Reaver'
                description = 'A disruptor: leaps clean over the front line onto archers and casters, scattering everyone nearby on landing. Fragile once surrounded'
                break
            case 'reaper':
                title = 'Reaper'
                description = 'Tough and fast demons that deal damage in an area around them and heal with each takedown'
                break
            case 'spear':
                title = 'Spear'
                description = 'Skirmishers: piercing javelin volleys, recovered while disengaged. Long reach in melee'
                break
            case 'phalanx':
                title = 'Phalanx'
                description = 'Braced spearmen: melee attacks from the front are halved on their shields. Flank them or shoot them'
                break
            case 'knight':
                title = 'Knight'
                description = 'Full plate shrugs off weak hits from every direction and cannot be shoved. The greatsword falls slowly and cleaves everything in its arc'
                break
            case 'zombie':
                title = 'Zombie Pack'
                description = 'Six shambling zombies. They rot away over time, so spend them quickly'
                break
        }

        if (title && description) {
            text(title, x, titleY)
            textSize(width / 75)
            text(description, x, descY, w)
            if (mode != 'autochess' && this.model && this.model.cost) {
                fill(100, 150, 100)
                text('$' + this.model.cost, x, h - titleY)
            }
        }
    }

    this.isTouchingMouse = function () {
        return mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 && mouseY > this.y - this.h / 2 && mouseY < this.y + this.h / 2
    }
}