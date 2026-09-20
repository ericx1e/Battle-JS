// Autochess engine — fully data-driven:
//   * every sellable troop in BALANCE appears in the shop automatically
//     (unlock stage and rarity derive from its cost; nothing is hand-listed)
//   * buffs come from the AUTOCHESS_BUFFS registry (autochess/buffs.js)
//   * enemy armies are bought with the same combat gold from the same pool,
//     on an EXPONENTIAL budget — the run always ends in a real fight
function AutochessEngine() {
    this.lives = 3
    this.victories = 0
    this.streak = 0
    this.gold = 12
    this.stage = 1
    this.enemyKills = 0

    this.status = 'preparing' // preparing | battling | victory | defeat | gameover

    this.buffs = {} // id -> stacks owned

    let selectedTroop = undefined
    const shopLength = 5
    let shopWidth = width * 2 / 4
    let shopHeight = height / 8
    let shopX = width / 2
    let shopY = height - shopHeight / 1.5
    let shopButtonSize = shopHeight * 4 / 5
    let shopButtonOffset = shopWidth / 6

    // ---------- derivations from balance.js (no hand-authored tables) ----------

    this.unlockStage = function (name) {
        return max(1, round(BALANCE[name].cost / 10)) // pricier troops unlock later
    }

    this.troopWeight = function (name) {
        return max(1, round(24 / BALANCE[name].cost)) // cheaper troops appear more often
    }

    this.isRangedRole = function (name) {
        const b = BALANCE[name]
        return b.rangeMult >= 1.5 || b.atk == 0 // long range or pure support goes backline
    }

    // ---------- difficulty ----------

    // Exponential: crosses the player's capped army value in the low-to-mid teens,
    // so buffs and economy discipline decide how far past that you survive.
    this.enemyBudget = function () {
        return floor(45 * pow(1.35, this.stage - 1))
    }

    // army size cap forces quality-over-quantity as stages climb — without it an
    // uncapped swarm beats any budget (numbers win quadratically)
    this.armyCap = function () {
        return 25 + 3 * this.stage
    }

    this.isEliteStage = function () {
        return this.stage % 5 == 0 // every 5th wave hits harder
    }

    this.spawnEnemyWave = function () {
        let budget = this.enemyBudget()
        const total = budget
        const buffer = width / 30

        const pool = []
        for (const name in BALANCE) {
            const b = BALANCE[name]
            if (b.sold === false || this.unlockStage(name) > this.stage) continue
            pool.push({
                name,
                weight: this.troopWeight(name),
                ranged: this.isRangedRole(name),
                pack: b.shopPack || 1,
                cost: b.cost * (b.shopPack || 1),
            })
        }

        const spawned = []
        const unitCap = 250 // beyond this, budget becomes stats instead of bodies
        let guard = 1000
        while (guard-- > 0 && spawned.length < unitCap) {
            const affordable = pool.filter(e => e.cost <= budget)
            if (!affordable.length) break
            const pick = weightedPick(affordable)
            for (let i = 0; i < pick.pack; i++) {
                const x = pick.ranged
                    ? random(width * 0.75, width - buffer)
                    : random(width / 2 + buffer, width * 0.72)
                const y = random(buffer, height - buffer)
                const u = makeTroop(pick.name, x, y, 'blue')
                blueTroops.push(u)
                spawned.push(u)
            }
            budget -= pick.cost
        }

        // leftover budget (hit the unit cap) and elite waves become raw stats:
        // health scales linearly, damage as its square root — sustain comps can
        // outlast bigger health bars, but not forever-growing hits
        let statMul = 1 + (spawned.length ? budget / max(1, total - budget) : 0)
        if (this.isEliteStage()) statMul *= 1.25
        if (statMul > 1.01) {
            spawned.forEach(u => {
                u.maxHitpoints = floor(u.maxHitpoints * statMul)
                u.hitpoints *= statMul
                if (u.attackPower) u.attackPower *= sqrt(statMul)
            })
        }
    }

    // ---------- shop ----------

    this.savedTroops = []
    this.savedPositions = []

    this.shopButtons = []
    this.shopButtons[shopLength] = new Button(shopX - shopLength / 2 * shopButtonOffset + shopButtonOffset * shopLength, shopY, shopButtonSize, shopButtonSize, 'shop_refresh')
    this.startButton = new Button(shopX + shopWidth / 2 + shopButtonSize * 1.2, shopY, shopButtonSize * 1.5, shopButtonSize, 'start')

    this.buffStacks = function (key) {
        return this.buffs[key] || 0
    }

    this.buffPrice = function (key) {
        return AUTOCHESS_BUFFS[key].price + 3 * this.buffStacks(key) // stacking gets pricier
    }

    // merchant guild discount applies to troops only
    this.itemCost = function (id, base) {
        if (id.startsWith('shop_') && id != 'shop_refresh' && this.buffStacks('merchant')) {
            return max(1, base - 1)
        }
        return base
    }

    this.generateShop = function () {
        const troopPool = []
        for (const name in BALANCE) {
            const b = BALANCE[name]
            if (b.sold === false || this.unlockStage(name) > this.stage) continue
            troopPool.push({ id: 'shop_' + name, weight: this.troopWeight(name) })
        }
        const buffPool = []
        for (const key in AUTOCHESS_BUFFS) {
            if (this.buffStacks(key) >= AUTOCHESS_BUFFS[key].maxStacks) continue
            buffPool.push({ id: 'buff_' + key, weight: AUTOCHESS_BUFFS[key].weight, key })
        }

        let buffsOffered = 0
        for (let i = 0; i < shopLength; i++) {
            let pool = troopPool
            // from stage 2, ~30% of slots offer a buff (max 2 per shop, no duplicates)
            if (this.stage >= 2 && buffsOffered < 2 && buffPool.length && random() < 0.3) {
                pool = buffPool
            }
            const pick = weightedPick(pool)
            if (!pick) continue
            this.shopButtons[i] = new Button(shopX - shopLength / 2 * shopButtonOffset + shopButtonOffset * i, shopY, shopButtonSize, shopButtonSize, pick.id)
            if (pick.key) {
                this.shopButtons[i].shopCost = this.buffPrice(pick.key)
                buffsOffered++
                buffPool.splice(buffPool.indexOf(pick), 1)
            }
        }
    }

    this.generateShop()

    // called from Button.onClick for any shop_*/buff_* purchase; returns true if bought
    this.buyFromShop = function (id, cost) {
        if (this.status != 'preparing') return false
        cost = this.itemCost(id, cost)
        if (this.gold < cost) return false

        if (id == 'shop_refresh') {
            this.gold -= cost
            this.generateShop()
            return true
        }

        if (id.startsWith('buff_')) {
            const key = id.substring(5)
            const buff = AUTOCHESS_BUFFS[key]
            if (!buff || this.buffStacks(key) >= buff.maxStacks) return false
            this.buffs[key] = this.buffStacks(key) + 1
            if (buff.instant) buff.instant(this)
            // re-apply to the current army so the shop purchase shows immediately
            redTroops.forEach(t => { t.reset(); applyUnitBuffs(t) })
            this.gold -= cost
            return true
        }

        const item = id.substring(5)
        const b = BALANCE[item]
        if (!b) return false
        const pack = b.shopPack || 1
        if (redTroops.length + pack > this.armyCap()) return false // army is full — sell something
        for (let i = 0; i < pack; i++) {
            redTroops.push(makeTroop(item, width / 4 + random(-1, 1), height / 2 + random(-1, 1), 'red'))
        }
        this.gold -= cost
        return true
    }

    // ---------- economy ----------

    this.interest = function () {
        const cap = this.buffStacks('treasury') ? 10 : 5
        return min(floor(this.gold / 10), cap)
    }

    this.income = function () {
        return 12 + this.stage + this.interest()
            + 3 * this.buffStacks('treasury')
            + min(this.streak, 3) // win streak bonus
    }

    // ---------- round flow ----------

    this.update = function () {
        if (this.status == 'preparing') {
            if (selectedTroop) {
                selectedTroop.pos.x = constrain(mouseX, selectedTroop.size, width / 2 - selectedTroop.size)
                selectedTroop.pos.y = constrain(mouseY, selectedTroop.size, height - selectedTroop.size)
                // allow dragging over the shop to sell — track raw mouse for the drop
                if (this.mouseOverShop()) {
                    selectedTroop.pos.x = mouseX
                    selectedTroop.pos.y = mouseY
                }
            }
        } else if (this.status == 'battling') {
            if (battling) {
                if (redTroops.length == 0) {
                    battling = false
                    this.lives--
                    this.streak = 0
                    this.status = this.lives <= 0 ? 'gameover' : 'defeat'
                    if (this.status == 'gameover') {
                        autochessBestStage = max(autochessBestStage, this.stage)
                        saveProgress()
                    }
                }
                if (blueTroops.length == 0) {
                    battling = false
                    this.victories++
                    this.streak++
                    this.status = 'victory'
                }
            }
        }
    }

    this.startBattle = function () {
        if (this.status != 'preparing' || redTroops.length == 0) return
        this.enemyKills = 0
        this.savedTroops = redTroops.map((troop) => { troop.reset(); applyUnitBuffs(troop); return troop })
        this.savedPositions = redTroops.map((troop) => createVector(troop.pos.x, troop.pos.y))
        this.status = 'battling'
        this.spawnEnemyWave()
        battling = true
    }

    this.loadTroops = function () {
        clearTroops()
        // push into the live array first, THEN reset: reset() re-binds each troop's
        // allies/toRemove references to the current globals (clearTroops reassigns them)
        for (let i = 0; i < this.savedTroops.length; i++) {
            redTroops.push(this.savedTroops[i])
        }
        for (let i = 0; i < redTroops.length; i++) {
            const troop = redTroops[i]
            troop.reset()
            troop._queuedRemove = false
            applyUnitBuffs(troop)
            troop.pos.x = this.savedPositions[i].x
            troop.pos.y = this.savedPositions[i].y
        }
    }

    this.endRound = function () {
        const bounty = this.buffStacks('bounty') * floor(this.enemyKills / 4)
        this.gold += this.income() + bounty
        this.stage++
        this.status = 'preparing'
        this.loadTroops()
        this.generateShop()
    }

    this.mouseOverShop = function () {
        return mouseX > shopX - shopWidth / 2 && mouseX < shopX + shopWidth / 2 &&
            mouseY > shopY - shopHeight / 2 && mouseY < shopY + shopHeight / 2
    }

    // ---------- UI ----------

    this.showUI = function () {
        if (this.status == 'preparing') {
            fill(0, 100)
            noStroke()
            rectMode(CENTER)
            rect(shopX, shopY, shopWidth, shopHeight, shopWidth / 25, shopWidth / 25)

            if (selectedTroop) {
                // selling hint
                fill(255, this.mouseOverShop() ? 230 : 120)
                textAlign(CENTER, CENTER)
                textSize(shopHeight / 4)
                text('drop here to sell', shopX, shopY - shopHeight * 0.85)
            }

            this.shopButtons.forEach((button) => {
                if (button) {
                    button.show()
                }
            })
            this.startButton.show()

            // income preview
            noStroke()
            fill(255, 220, 50, 200)
            textAlign(LEFT, CENTER)
            textSize(width / 70)
            text('+' + this.income() + ' next round' + (this.interest() ? ' (incl. ' + this.interest() + ' interest)' : ''), width / 25 + width / 40, width / 25 + width / 30)

            // threat preview: compare army value against the incoming wave
            let armyValue = 0
            redTroops.forEach(t => armyValue += t.cost || 0)
            fill(255, 160)
            textAlign(CENTER, TOP)
            textSize(width / 75)
            let threat = 'enemy power ' + this.enemyBudget() + (this.isEliteStage() ? '  —  ELITE WAVE' : '')
                + '   |   your army ' + redTroops.length + '/' + this.armyCap() + ' (power ' + armyValue + ')'
            text(threat, width / 2, height / 60 + width / 32)
        } else if (this.status == 'victory') {
            const bounty = this.buffStacks('bounty') * floor(this.enemyKills / 4)
            drawBanner('Victory!', '+' + (this.income() + bounty) + ' gold — click for stage ' + (this.stage + 1))
            if (mouseIsPressed) this.endRound()
        } else if (this.status == 'defeat') {
            drawBanner('Defeat', this.lives + (this.lives == 1 ? ' life' : ' lives') + ' left — click to continue')
            if (mouseIsPressed) this.endRound()
        } else if (this.status == 'gameover') {
            drawBanner('Game Over', 'reached stage ' + this.stage + ' — best ' + autochessBestStage + ' — click for title')
            if (mouseIsPressed) changeScreen('title')
            return
        }

        drawCoin(width / 25, width / 25, width / 30, this.gold)

        // lives as a row of team dots
        for (let i = 0; i < this.lives; i++) {
            drawSettings('red', 255, width / 60)
            ellipse(width / 25 + i * width / 45, width / 25 + width / 15, width / 60)
        }

        this.showOwnedBuffs()

        noStroke()
        if (this.isEliteStage()) {
            fill(255, 150, 150)
        } else {
            fill(255)
        }
        textAlign(CENTER, TOP)
        textSize(width / 40)
        text('Stage ' + this.stage + (this.isEliteStage() ? ' — ELITE' : ''), width / 2, height / 60)
    }

    this.showOwnedBuffs = function () {
        const tileS = width / 42
        let hovered = undefined
        let i = 0
        for (const key in AUTOCHESS_BUFFS) {
            if (!this.buffStacks(key)) continue
            const buff = AUTOCHESS_BUFFS[key]
            const tx = width / 25 + (i % 6) * tileS * 1.25
            const ty = width / 25 + width / 15 + width / 28 + floor(i / 6) * tileS * 1.25
            rectMode(CENTER)
            noStroke()
            fill(225, 245, 225, 220)
            rect(tx, ty, tileS, tileS, tileS / 5)
            fill(60, 120, 60)
            textAlign(CENTER, CENTER)
            textSize(tileS / 3.5)
            text(buff.icon, tx, ty)
            if (this.buffStacks(key) > 1) {
                textSize(tileS / 4)
                text('x' + this.buffStacks(key), tx + tileS / 3, ty + tileS / 2.6)
            }
            if (mouseX > tx - tileS / 2 && mouseX < tx + tileS / 2 && mouseY > ty - tileS / 2 && mouseY < ty + tileS / 2) {
                hovered = buff
            }
            i++
        }
        if (hovered) {
            const w = width / 5, h = width / 14
            const bx = constrain(mouseX + w / 2, w / 2, width - w / 2)
            fill(240)
            noStroke()
            rect(bx, mouseY + h, w, h, w / 30)
            fill(0)
            textAlign(CENTER, TOP)
            textSize(width / 70)
            text(hovered.name, bx, mouseY + h - h / 2.4)
            textSize(width / 95)
            textWrap(WORD)
            text(hovered.desc, bx, mouseY + h - h / 6, w * 0.9)
        }
    }

    // ---------- input ----------

    this.onMouseDown = function () {
        if (this.status == 'preparing') {
            this.startButton.onClick()
            for (let i = 0; i < this.shopButtons.length; i++) {
                if (this.shopButtons[i] && this.shopButtons[i].onClick()) {
                    if (i != shopLength) { // refresh slot regenerates in place, never empties
                        this.shopButtons[i] = undefined
                    }
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
            if (this.mouseOverShop()) {
                // sell it back at (discounted) shop price — no arbitrage
                const index = redTroops.indexOf(selectedTroop)
                if (index != -1) {
                    redTroops.splice(index, 1)
                    const base = BALANCE[selectedTroop.name] ? BALANCE[selectedTroop.name].shopCost : 1
                    this.gold += this.itemCost('shop_' + selectedTroop.name, base)
                }
            } else {
                selectedTroop.pos.x = constrain(selectedTroop.pos.x, selectedTroop.size, width / 2 - selectedTroop.size)
                selectedTroop.pos.y = constrain(selectedTroop.pos.y, selectedTroop.size, height - selectedTroop.size)
            }
            selectedTroop = undefined
        }
    }
}
