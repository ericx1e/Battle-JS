p5.disableFriendlyErrors = true;

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

let panX = 0
let panY = 0
let zoom;
let battling = false
let canZoom = false
let healthBars = false

let troopId = 0

let menuOpen = false;
let buttons = []

let font

function preload() {
    font = loadFont("Ubuntu/Ubuntu-Regular.ttf")
}

let canvasWidth
let canvasHeight

function setup() {
    canvasWidth = window.innerWidth * 3 / 4
    canvasHeight = window.innerHeight * 3 / 4
    canvas = createCanvas(canvasWidth, canvasHeight)
    canvas.position((window.innerWidth - canvasWidth) / 2, (window.innerHeight - canvasHeight) / 2)
    zoom = (height / 2) / tan(PI / 6)

    // for (let i = 0; i < 500; i++) {
    //     i % 2 == 0 ? redTroops.push(new Soldier(random(0, width), random(0, height), 'red')) : blueTroops.push(new Soldier(random(0, width), random(0, height), 'blue'))
    //     i % 2 == 0 ? redTroops.push(new Archer(random(0, width), random(0, height), 'red')) : blueTroops.push(new Archer(random(0, width), random(0, height), 'blue'))
    // }

    /*
    for (let x = 20; x < width / 2; x += width / 25) {
        for (let y = 20; y < height; y += height / 15) {
            if (x <= 20) {
                blueTroops.push(new Archer(width - x, y, 'blue'))
                redTroops.push(new Archer(x, y, 'red'))
            } else {
                blueTroops.push(new Soldier(width - x, y, 'blue'))
                redTroops.push(new Soldier(x, y, 'red'))
            }
        }

    }
    redTroops.push(new Necromancer(0, height / 2, 'red'), new Summoner(1, height / 2, 'red'), new EWizard(3, height / 2, 'red'))
    blueTroops.push(new Necromancer(width, height / 2, 'blue'), new Summoner(width - 1, height / 2, 'blue'), new EWizard(width - 3, height / 2, 'blue'))

    */

    menu = new Menu()
}

function draw() {
    background(51)
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
        }


        bi++;
        ri++;
    }

    for (let i = 0; i < blueForces.length; i++) {
        let force = blueForces[i]
        force.update(redTroops)
        if (force.isDone) {
            blueForces.splice(i, 1)
        }
    }

    for (let i = 0; i < redForces.length; i++) {
        let force = redForces[i]
        force.update(blueTroops)
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


    noStroke()
    fill(255)
    text('fps: ' + Math.floor(frameRate()), 50, 50)

    fill(255)
    text(redTroops.length, width / 4, height / 2)

    fill(255)
    text(blueTroops.length, width * 3 / 4, height / 2)

    if (!menuOpen) {
        if (mouseX < menu.w / 8) {
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
                default:
                    newTroopGhost = undefined
            }
            if (newTroopGhost) {
                newTroopGhost.show(50);
            }
        }
    }

    if (menuOpen && mouseX > menu.w * 1.5) {
        menuOpen = false
    }

    if (menuOpen) {
        menu.x = lerp(menu.x, 0, 0.1)
    } else {
        menu.x = lerp(menu.x, -menu.w, 0.1)
    }

    menu.show()

    if (keyIsPressed && keyCode == SHIFT && mouseIsPressed && frameCount % 5 == 0) {
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
    if (canZoom) {
        let dX = mouseX - pmouseX
        let dY = mouseY - pmouseY
        panX += dX
        panY += dY
        if (Math.abs(dX) > 10 || Math.abs(dY) > 10) {
            panning = true
        }
    }
}

function mouseReleased() {
    if (!panning && !menuOpen) {
        let team
        if (mouseX < width / 2) {
            team = 'red'
        } else {
            team = 'blue'
        }

        switch (newTroopId) {
            case 'soldier':
                newTroop = new Soldier(mouseX, mouseY, team)
                break;
            case 'archer':
                newTroop = new Archer(mouseX, mouseY, team)
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
        }

        if (newTroop) {
            team == 'red' ? redTroops.push(newTroop) : blueTroops.push(newTroop)
        }
    }
    panning = false
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
}

function keyReleased() {
    keyIsPressed = false
}

function keyTyped() {
    if (key == ' ') {
        battling = !battling;
    }
    if (key == 'c') {
        redTroops = []
        blueTroops = []
        redProjectiles = []
        blueProjectiles = []
        blueToRemove = []
        redToRemove = []
        battling = false;
    }
}

function mousePressed() {
    if (menuOpen) {
        menu.onClick()
    }
}