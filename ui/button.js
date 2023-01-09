function Button(x, y, s, id) {
    this.x = x
    this.y = y
    this.s = s
    this.model

    let modelX = this.x
    let modelY = this.y
    let modelTeam = 'blue'

    switch (id) {
        case 'soldier':
            this.model = new Soldier(modelX, modelY, modelTeam)
            break
        case 'archer':
            this.model = new Archer(modelX, modelY, modelTeam)
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
    }

    this.show = function () {
        rectMode(CENTER)
        noStroke()

        if (this.model) {
            if (this.isTouchingMouse()) {
                if (menuOpen) {
                    extraInfo(id)
                }
                fill(230)
            } else {
                fill(255)
            }
            rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
            this.model.show()
            /*
            fill(0)
            textAlign(CENTER, CENTER)
            textSize(this.s / 4)
            text(id, this.x, this.y + this.s / 4)
            */
        } else {
            switch (id) {
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
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text(tx, this.x, this.y)
                    break
                case 'rand_all':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text('all' + '\n' + 'random', this.x, this.y)
                    break
                case 'erase':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text(id, this.x, this.y)
                    break
                case 'clear':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text(id, this.x, this.y)
                    break
                case 'mode':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text(id, this.x, this.y)
                    break
            }
        }
    }

    this.onClick = function () {
        if (this.isTouchingMouse()) {
            if (this.model) {
                newTroopId = id;
            } else {
                newTroopId = undefined
                switch (id) {
                    case 'start':
                        battling = !battling;
                        break
                }
            }
        }
    }

    this.isTouchingMouse = function () {
        return mouseX > this.x - this.s / 2 && mouseX < this.x + this.s / 2 && mouseY > this.y - this.s / 2 && mouseY < this.y + this.s / 2
    }
}

function extraInfo(id) {
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
    }

    if (title && description) {
        text(title, x, titleY)
        textSize(width / 75)
        text(description, x, descY, w)
    }
}