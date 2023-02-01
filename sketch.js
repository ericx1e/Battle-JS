p5.disableFriendlyErrors = true;

let screen = 'title'
let mode

let battleFrameCount = 0
let redTroops = []
let redToRemove = []
let redProjectiles = []
let redForces = []
let blueTroops = []
let blueToRemove = []
let blueProjectiles = []
let blueForces = []

let newTroop
let newTroopId
let newTroopGhost
let erasing = false
let eraseSize

let panX = 0
let panY = 0
let zoom;
let battling = false
let canZoom = false
let healthBars = false

let troopId = 0

let menu
let menuOpen = false;
let titleButtons
let levels = []
let currentLevel
let levelButtons
let firstOpen = true

let font
// let fontItalic

let shared
let lobbyName

function preload() {
    font = loadFont("Ubuntu/Ubuntu-Regular.ttf")
    // fontItalic = loadFont("Ubuntu/Ubuntu-Italic.ttf")
}

let canvasWidth
let canvasHeight

function setup() {
    // frameRate(10)
    textFont(font)
    canvasWidth = window.innerWidth * 5 / 6
    // canvasHeight = window.innerHeight * 3 / 4
    canvasHeight = canvasWidth / 16 * 9
    canvas = createCanvas(canvasWidth, canvasHeight)
    canvas.position((window.innerWidth - canvasWidth) / 2, (window.innerHeight - canvasHeight) / 2)
    zoom = (height / 2) / tan(PI / 6)

    eraseSize = width / 40

    let buttonSize = width / 14
    titleButtons = [new Button(width / 2 - 2.5 * buttonSize, height * 4 / 5, buttonSize * 2, buttonSize, 'title_campaign'), new Button(width / 2, height * 4 / 5, buttonSize * 2, buttonSize, 'title_sandbox'), new Button(width / 2 + 2.5 * buttonSize, height * 4 / 5, buttonSize * 2, buttonSize, 'title_versus')]

    let levelButtonSize = width / 13
    let levelButtonsPerRow = 8
    levelButtons = [new Button(levelButtonSize * 1.25, width / 40 + levelButtonSize / 4, levelButtonSize, levelButtonSize / 2, 'return_to_title')]
    for (let level = 0; level < 9; level++) {
        levels.push(new Level(level))
        levelButtons.push(new Button(levelButtonSize * 1.25 + (level % levelButtonsPerRow) * levelButtonSize * 1.5, width / 20 + levelButtonSize + parseInt(level / levelButtonsPerRow) * levelButtonSize * 1.5, levelButtonSize, levelButtonSize, 'level' + level))
    }
    levels[0].locked = false

    let versusButtonSize = width / 13
    versusLobbyButtons = [new Button(versusButtonSize * 1.25, width / 40 + versusButtonSize / 4, versusButtonSize, versusButtonSize / 2, 'return_to_title'), new Button(width / 2, height * 4 / 5, versusButtonSize * 2, versusButtonSize, 'versus_join')]
}

function draw() {
    switch (screen) {
        case 'title':
            titleLoop()
            break
        case 'level_select':
            levelSelectLoop()
            break
        case 'versus_lobby':
            versusLobbyLoop()
            break
        case 'versus_loading':
            versusLoadingLoop()
            break
        case 'game':
            gameLoop()
            break
    }
}

function titleLoop() {
    background(39)

    strokeWeight(width / 200)
    fill(120, 120, 255, 150)
    stroke(150, 150, 255)
    ellipse(width / 10, height * 4 / 5, width / 10)
    fill(255, 120, 120, 150)
    stroke(255, 150, 150)
    ellipse(width * 9.2 / 10, height * 3 / 5, width / 10)

    let titleSize = width / 10
    let offset = titleSize / 12
    textSize(titleSize)
    noStroke()
    fill(255)
    textAlign(CENTER, CENTER)
    text('Battle Simulator', width / 2, height / 4)
    fill(255, 100)
    text('Battle Simulator', width / 2 + offset, height / 4)
    textSize(titleSize / 2)
    offset = titleSize / 24
    fill(255)
    textAlign(CENTER, CENTER)
    text('created by Eric Xie', width / 2, height * 2.5 / 5)
    fill(255, 100)
    text('created by Eric Xie', width / 2 + offset, height * 2.5 / 5)

    titleButtons.forEach(button => {
        button.show()
    })
}

function levelSelectLoop() {
    background(39)
    fill(255)
    textSize(width / 20)
    textAlign(CENTER, CENTER)
    text('Level Select', width / 2, height / 15)
    levelButtons.forEach(button => {
        button.show()
    })
}

function versusLobbyLoop() {
    background(39)
    fill(255)
    textSize(width / 20)
    textAlign(CENTER, CENTER)
    text('Enter Lobby Name', width / 2, height / 15)
    versusLobbyButtons.forEach(button => {
        button.show()
    })

    fill(255)
    textSize(height / 8)
    text(lobbyName + '_', width / 2, height / 2.5)

}

function versusLoadingLoop() {
    background(39)
    push()
    translate(width / 2, height / 2)
    // rotate(battleFrameCount / 60)
    fill(255)
    textSize(width / 10)
    text('loading', 0, 0)
    pop()
    // if (shared) {
    //     mode = 'sandbox'
    //     changeScreen('game')
    // }
}

function gameLoop() {
    background(51)
    if (battling) {
        battleFrameCount++
        if (shared) {
        }
    }

    if (canZoom) {
        camera(-panX, -panY, zoom, -0, -0, 0, 0, 1, 0)
    }
    textFont(font)
    fill(100)
    noStroke()
    textSize(20)
    strokeWeight(4)
    stroke(100)
    // drawingContext.setLineDash([width / 50, width / 50])
    line(width / 2, 0, width / 2, height)
    noFill()
    rectMode(CENTER)
    rect(width / 2, height / 2, width, height)

    let bi = 0;
    let ri = 0;

    // blueToRemove = []
    // redToRemove = []

    let blueHasNecro = false
    let redHasNecro = false

    while (blueTroops[bi] || redTroops[ri]) {
        let blueTroop = blueTroops[bi]
        let redTroop = redTroops[ri]

        if (blueTroop) {
            if (blueTroop.name == 'necromancer') {
                blueHasNecro = true
            }
            blueTroop.show()
            if (battling) {
                let removed = blueTroop.update(blueTroops, redTroops)
                if (blueTroop.isDead) {
                    if (blueToRemove.includes(blueTroop)) {
                        blueTroop.size *= 0.999

                    } else {
                        blueToRemove.push(blueTroop)
                    }
                }
                if (blueTroop.name == 'necromancer' && removed) {
                    bi -= removed
                }
            }
            bi++;
        }
        if (redTroop) {
            if (redTroop.name == 'necromancer') {
                redHasNecro = true
            }
            redTroop.show()
            if (battling) {
                let removed = redTroop.update(redTroops, blueTroops)
                if (redTroop.isDead) {
                    if (redToRemove.includes(redTroop)) {
                        redTroop.size *= 0.999
                    } else {
                        redToRemove.push(redTroop)
                    }
                }
                if (redTroop.name == 'necromancer' && removed) {
                    ri -= removed
                }
            }
            ri++;
        }
    }

    if (shared && shared.redTroops && shared.blueTroops) {
        if (partyIsHost()) {
            shared.battling = battling
            // blueTroops = []
            for (let i = blueTroops.length; i < shared.blueTroops.length; i++) {
                pos = shared.blueTroops[i]
                if (pos) {
                    let troop = new Soldier(map(pos.x, 0, pos.w, 0, width), map(pos.y, 0, pos.h, 0, height), 'blue')
                    troop.firstAttackFrame = 0 + pos.firstAttackFrame
                    blueTroops.push(troop)
                    shared.blueTroops[i] = undefined
                }
            }
            // shared.blueTroops = []
        } else {
            battling = shared.battling
            // redTroops = []
            for (let i = redTroops.length; i < shared.redTroops.length; i++) {
                pos = shared.redTroops[i]
                if (pos) {
                    let troop = new Soldier(map(pos.x, 0, pos.w, 0, width), map(pos.y, 0, pos.h, 0, height), 'red')
                    troop.firstAttackFrame = 0 + pos.firstAttackFrame
                    redTroops.push(troop)
                    shared.redTroops[i] = undefined
                }
            }
            // shared.redTroops = []
        }
    }


    for (let i = 0; i < blueForces.length; i++) {
        let force = blueForces[i]
        force.update(blueTroops, redTroops)
        if (force.isDone) {
            blueForces.splice(i, 1)
        }
    }

    for (let i = 0; i < redForces.length; i++) {
        let force = redForces[i]
        force.update(redTroops, blueTroops)
        if (force.isDone) {
            redForces.splice(i, 1)
        }
    }

    for (let i = 0; i < blueToRemove.length; i++) { //backwards to not mess up index while splicing
        let toRemove = blueToRemove[i]
        let index = blueTroops.indexOf(toRemove)
        if (index == -1) {
            // toRemove.splice(i, 1)
            // i--
            continue
        }
        if (blueHasNecro && toRemove.name != 'zombie' && toRemove.name != 'necromancer') {
            continue
        }
        blueTroops.splice(index, 1)
        i--
        blueToRemove.splice(i, 1)
        // i--
    }

    for (let i = 0; i < redToRemove.length; i++) {
        let toRemove = redToRemove[i]
        let index = redTroops.indexOf(toRemove)
        if (index == -1) {
            // toRemove.splice(i, 1)
            // i--
            continue
        }
        if (redHasNecro && toRemove.name != 'zombie' && toRemove.name != 'necromancer') {
            continue
        }
        redTroops.splice(index, 1)
        i--
        redToRemove.splice(i, 1)
    }

    updateProjectiles(blueProjectiles, redTroops)
    updateProjectiles(redProjectiles, blueTroops)

    /*
    noStroke()
    fill(255)
    text('fps: ' + Math.floor(frameRate()), 50, 50)
    */

    if (mode == 'campaign' && currentLevel) {
        noStroke()
        fill(70, 200, 70)
        textAlign(CORNER)
        text('$' + currentLevel.money, width / 20, width / 20)
    }

    /*
    fill(255)
    text(redTroops.length, width / 4, height / 2)

    fill(255)
    text(blueTroops.length, width * 3 / 4, height / 2)
    */

    if (!menuOpen) {
        if (firstOpen) {
            fill(255)
            noStroke()
            textSize(width / 50)
            textAlign(CORNER, CORNER)
            text("\t<<\tclick the left edge to open menu", 0, width / 10)
            stroke(255)
            strokeWeight(width / 500)
        }
        if (mouseX < menu.w / 16) {
            menu.showBit()
            if (mouseX < menu.w / 16 && mouseIsPressed) {
                menuOpen = true
            }
        } else {
            let team
            if (mouseX < width / 2) {
                team = 'red'
            } else {
                team = 'blue'
            }
            switch (newTroopId) {
                case 'soldier':
                    newTroopGhost = new Soldier(mouseX, mouseY, team)
                    break;
                case 'archer':
                    newTroopGhost = new Archer(mouseX, mouseY, team)
                    break
                case 'spear':
                    newTroopGhost = new Spear(mouseX, mouseY, team)
                    break
                case 'necromancer':
                    newTroopGhost = new Necromancer(mouseX, mouseY, team)
                    break
                case 'summoner':
                    newTroopGhost = new Summoner(mouseX, mouseY, team)
                    break
                case 'ewizard':
                    newTroopGhost = new EWizard(mouseX, mouseY, team)
                    break
                case 'shield':
                    newTroopGhost = new Shield(mouseX, mouseY, team)
                    break
                case 'healer':
                    newTroopGhost = new Healer(mouseX, mouseY, team)
                    break
                case 'reaper':
                    newTroopGhost = new Reaper(mouseX, mouseY, team)
                    break
                default:
                    newTroopGhost = undefined
                    break
            }
            if (newTroopGhost) {
                if (team == 'red' || mode == 'sandbox') {
                    newTroopGhost.show(50);
                }
            }
            if (erasing) {
                drawSettings('red')
                stroke(255, 100)
                fill(255, 50)
                ellipse(mouseX, mouseY, eraseSize, eraseSize)
            }
        }
    }

    if (menuOpen && mouseX > menu.w * 1.3) {
        menuOpen = false
        firstOpen = false
    }

    if (menuOpen) {
        menu.x = lerp(menu.x, 0, 0.1)
    } else {
        menu.x = lerp(menu.x, -menu.w, 0.1)
    }

    menu.show()

    if (mode == 'campaign' && currentLevel) {
        currentLevel.update()
    }

    if (keyIsPressed && keyCode == SHIFT && mouseIsPressed && battleFrameCount % 5 == 0) {
        mouseReleased()
    }

}

function updateProjectiles(projectiles, troops) {
    for (let i = 0; i < projectiles.length; i++) {
        projectile = projectiles[i]
        projectile.show()
        if (battling) {
            if (projectile.move(troops)) {
                projectiles.splice(i, 1)
                i--
            }
        }
    }
}

let panning = false

function mouseDragged() {
    if (screen == 'game') {
        if (canZoom) {
            let dX = mouseX - pmouseX
            let dY = mouseY - pmouseY
            panX += dX
            panY += dY
            if (Math.abs(dX) > 10 || Math.abs(dY) > 10) {
                panning = true
            }
        }
        if (!menuOpen && erasing) {
            eraser()
        }
    }
}

function eraser() {
    for (let i = 0; i < redTroops.length; i++) {
        troop = redTroops[i]
        if (distSquaredVal(mouseX, mouseY, troop.pos.x, troop.pos.y) < sqr(eraseSize / 2 + troop.size / 2)) {
            if (mode == 'campaign' && currentLevel) {
                currentLevel.money += troop.cost
            }
            redTroops.splice(i, 1)
            i--
        }
    }
    if (mode == 'sandbox') {
        for (let i = 0; i < blueTroops.length; i++) {
            troop = blueTroops[i]
            if (distSquaredVal(mouseX, mouseY, troop.pos.x, troop.pos.y) < sqr(eraseSize / 2 + troop.size / 2)) {
                blueTroops.splice(i, 1)
                i--
            }
        }
    }
}

function mouseReleased() {
    if (screen == 'game') {
        if (!panning && !menuOpen) {
            let team

            if (mouseX < width / 2) {
                team = 'red'
                if (shared && !partyIsHost()) {
                    return
                }
            } else {
                team = 'blue'
                if (mode == 'campaign') {
                    return
                }
                if (shared && partyIsHost()) {
                    return
                }
            }
            newTroop = undefined
            switch (newTroopId) {
                case 'soldier':
                    newTroop = new Soldier(mouseX, mouseY, team)
                    break
                case 'archer':
                    newTroop = new Archer(mouseX, mouseY, team)
                    break
                case 'spear':
                    newTroop = new Spear(mouseX, mouseY, team)
                    break
                case 'necromancer':
                    newTroop = new Necromancer(mouseX, mouseY, team)
                    break
                case 'summoner':
                    newTroop = new Summoner(mouseX, mouseY, team)
                    break
                case 'ewizard':
                    newTroop = new EWizard(mouseX, mouseY, team)
                    break
                case 'shield':
                    newTroop = new Shield(mouseX, mouseY, team)
                    break
                case 'healer':
                    newTroop = new Healer(mouseX, mouseY, team)
                    break
                case 'reaper':
                    newTroop = new Reaper(mouseX, mouseY, team)
                    break
                case 'wall':
                    newTroop = new Wall(mouseX, mouseY, team)
                    break
            }

            if (newTroop) {
                if (mode == 'campaign') {
                    if (currentLevel && currentLevel.money >= newTroop.cost) {
                        team == 'red' ? redTroops.push(newTroop) : blueTroops.push(newTroop)
                        currentLevel.money -= newTroop.cost
                    }
                } else if (mode == 'sandbox') {
                    team == 'red' ? redTroops.push(newTroop) : blueTroops.push(newTroop)
                }
                if (shared) {
                    team == 'red' ? shared.redTroops.push({ x: newTroop.pos.x, y: newTroop.pos.y, firstAttackFrame: newTroop.firstAttackFrame, w: width, h: height }) : shared.blueTroops.push({ x: newTroop.pos.x, y: newTroop.pos.y, firstAttackFrame: newTroop.firstAttackFrame, w: width, h: height })
                }
            }

            panning = false
        }
    }
}

// function mouseWheel(event) {

// }

window.addEventListener("wheel", function (e) {
    if (canZoom) {
        if (e.deltaY > 0)
            zoom *= 1.05;
        else
            zoom *= 0.95;
    }
});

let keyIsPressed = false

function keyPressed() {
    keyIsPressed = true
    if (keyCode == BACKSPACE) {
        lobbyName = lobbyName.substring(0, lobbyName.length - 1)
    }
}

function keyReleased() {
    keyIsPressed = false
}

function keyTyped() {
    if (screen == 'versus_lobby') {
        if (key.length == 1 && lobbyName.length < 4) {
            let keyUpper = key.toUpperCase()
            let ascii = keyUpper.charCodeAt(0)
            if (ascii >= 48 && ascii <= 57 || ascii >= 65 && ascii <= 90) {
                lobbyName += keyUpper
            }
        }
    } else if (screen == 'game' && mode == 'sandbox') {
        if (key == ' ') {
            battling = !battling;
        }
        if (key == 'c') {
            clearTroops()
        }
    }
}

function mousePressed() {
    if (!menuOpen && erasing) {
        eraser()
    }
    switch (screen) {
        case 'title':
            titleButtons.forEach(button => {
                button.onClick()
            })
            break
        case 'level_select':
            levelButtons.forEach(button => {
                button.onClick()
            })
            break
        case 'versus_lobby':
            versusLobbyButtons.forEach(button => {
                button.onClick()
            })
            break
        case 'game':
            if (menuOpen) {
                menu.onClick()
            }
            break
    }
}