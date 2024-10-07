function AutochessEngine() {
    this.lives = 5
    this.victories = 0
    this.gold = 10
    this.stage = 1

    this.status = 'preparing'

    this.buffs = []

    let selectedTroop = undefined
    const shopLength = 5
    let shopWidth = width * 2 / 4
    let shopHeight = height / 8
    let shopX = width / 2
    let shopY = height - shopHeight / 1.5
    let shopButtonSize = shopHeight * 4 / 5
    // let shopButtonOffset = shopButtonS * 1.25
    let shopButtonOffset = shopWidth / 6

    let shopStageMap = {
        1: ['shop_soldier', 'shop_soldier', 'shop_archer'],
        2: ['shop_soldier', 'shop_soldier', 'shop_soldier', 'shop_archer', 'shop_archer', 'shop_zombie'],
        3: ['shop_soldier', 'shop_soldier', 'shop_archer', 'shop_archer', 'shop_zombie', 'shop_soldier_health'],
        4: ['shop_soldier', 'shop_archer', 'shop_archer', 'shop_zombie', 'shop_shield', 'shop_soldier_health', 'shop_archer_spread'],
        5: ['shop_soldier', 'shop_archer', 'shop_archer', 'shop_zombie', 'shop_shield', 'shop_soldier_health', 'shop_archer_spread'],
    }

    this.savedTroops = []
    this.savedPositions = []

    this.shopButtons = []
    this.shopButtons[shopLength] = new Button(shopX - shopLength / 2 * shopButtonOffset + shopButtonOffset * shopLength, shopY, shopButtonSize, shopButtonSize, 'shop_refresh')
    // this.shopButtons[shopLength + 1] = new Button(shopX - shopLength / 2 * shopButtonOffset + shopButtonOffset * (shopLength + 1), shopY, shopButtonSize, shopButtonSize, 'start')

    this.generateShop = function () {
        let availableShop = shopStageMap[this.stage]
        for (let i = 0; i < shopLength; i++) {
            let randId = availableShop[parseInt(random(0, availableShop.length))]
            // console.log(randId.substring(5))
            while (this.buffs.includes(randId.substring(5))) {
                randId = availableShop[parseInt(random(0, availableShop.length))]
            }
            this.shopButtons[i] = new Button(shopX - shopLength / 2 * shopButtonOffset + shopButtonOffset * i, shopY, shopButtonSize, shopButtonSize, randId)
        }
    }

    this.generateShop()

    this.update = function () {
        // console.log(selectedTroop)
        if (this.status == 'preparing') {
            if (selectedTroop) {
                selectedTroop.pos.x = mouseX
                selectedTroop.pos.y = mouseY
            }
        } else if (this.status == 'battling') {
            if (battling) {
                if (redTroops.length == 0) {
                    battling = false
                    this.lives--
                    this.status = 'defeat'
                }
                if (blueTroops.length == 0) {
                    battling = false
                    this.victories++
                    this.status = 'victory'
                }
            }
        }
    }

    this.loadTroops = function () {
        clearTroops()
        redTroops = this.savedTroops.map((troop, i) => {
            troop.reset()
            troop.pos.x = this.savedPositions[i].x
            troop.pos.y = this.savedPositions[i].y
            return troop
        })
    }

    this.endRound = function () {
        console.log('help')
        this.status = 'preparing'
        this.loadTroops()
        this.generateShop()
        this.gold += 10 + this.stage
        this.stage++
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
            this.endRound()
        }
    }

    this.victory = function () {
        rectMode(CENTER)
        fill(200)
        rect(width / 2, height / 2, width, width / 6)
        textSize(width / 12)
        noStroke()
        fill(0)
        textAlign(CENTER, CENTER)
        text('Victory!', width / 2, height / 2)
        if (mouseIsPressed) {
            this.endRound()
        }
    }

    this.showUI = function () {
        if (this.status == 'preparing') {
            fill(0, 100)
            noStroke()
            rectMode(CENTER)
            rect(shopX, shopY, shopWidth, shopHeight, shopWidth / 25, shopWidth / 25)

            this.shopButtons.forEach((button) => {
                if (button) {
                    button.show()
                }
            })
        } else if (this.status == 'victory') {
            this.victory()
        } else if (this.status == 'defeat') {
            this.defeat()
        }

        drawCoin(width / 25, width / 25, width / 30, this.gold)

    }


    this.onMouseDown = function () {
        if (this.status == 'preparing') {
            for (let i = 0; i < this.shopButtons.length; i++) {
                if (this.shopButtons[i] && this.shopButtons[i].onClick()) {
                    // this.shopButtons.splice(i, 1)
                    this.shopButtons[i] = undefined
                }
            }

            if (selectedTroop == undefined) {
                for (let i = redTroops.length - 1; i >= 0; i--) {
                    let troop = redTroops[i]
                    if (distSquaredVal(mouseX, mouseY, troop.pos.x, troop.pos.y) < troop.size / 2 * troop.size / 2) {
                        selectedTroop = troop
                        redTroops.splice(i, 1)
                        redTroops.push(selectedTroop)
                        break
                    }
                }
            }
        }
    }

    this.onMouseRelease = function () {
        if (selectedTroop) {
            selectedTroop = undefined
        }
    }
}