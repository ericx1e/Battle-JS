let redTroops = []
let redProjectiles = []
let blueTroops = []
let blueProjectiles = []
let panX = 0
let panY = 0
let zoom;
let battling = false
let canZoom = false
let healthBars = false

let troopId = 0

let buttons = []

let font

function preload() {
    font = loadFont("Ubuntu/Ubuntu-Regular.ttf")
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL)
    canvas.position(0, 0)
    zoom = (height / 2) / tan(PI / 6)

    // for (let i = 0; i < 500; i++) {
    //     i % 2 == 0 ? redTroops.push(new Soldier(random(0, width), random(0, height), 'red')) : blueTroops.push(new Soldier(random(0, width), random(0, height), 'blue'))
    //     i % 2 == 0 ? redTroops.push(new Archer(random(0, width), random(0, height), 'red')) : blueTroops.push(new Archer(random(0, width), random(0, height), 'blue'))
    // }

    for (let i = 20; i < width / 2; i += 40) {
        for (let j = 20; j < height; j += 40) {
            if (i <= 20) {
                blueTroops.push(new Archer(width - i, j, 'blue'))
                redTroops.push(new Archer(i, j, 'red'))
            } else {
                blueTroops.push(new Soldier(width - i, j, 'blue'))
                redTroops.push(new Soldier(i, j, 'red'))
            }
        }
    }
}

function draw() {
    // console.log(redTroops.length, blueTroops.length)
    background(51)
    if (canZoom) {
        camera(-panX, -panY, zoom, -0, -0, 0, 0, 1, 0)
    }
    textFont(font)
    push()
    translate(-width / 2, -height / 2)
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
    let blueToRemove = []
    let redToRemove = []
    while (blueTroops[bi] || redTroops[ri]) {
        let blueTroop = blueTroops[bi]
        let redTroop = redTroops[ri]

        if (blueTroop) {
            blueTroop.show()
            if (battling) {
                blueTroop.update(blueTroops, redTroops)
                if (blueTroop.isDead) {
                    blueToRemove.push(bi)
                    // blueTroops.splice(bi, 1)
                    // bi--
                }
            }
        }
        if (redTroop) {
            redTroop.show()
            if (battling) {
                redTroop.update(redTroops, blueTroops)
                if (redTroop.isDead) {
                    redToRemove.push(ri)
                    // redTroops.splice(ri, 1)
                    // ri--
                }
            }
        }

        bi++;
        ri++;
    }

    for (let i = blueToRemove.length - 1; i >= 0; i--) { //backwards to not mess up index while splicing
        blueTroops.splice(blueToRemove[i], 1)
    }

    for (let i = redToRemove.length - 1; i >= 0; i--) {
        redTroops.splice(redToRemove[i], 1)
    }

    updateProjectiles(blueProjectiles, redTroops)
    updateProjectiles(redProjectiles, blueTroops)


    fill(255)
    text('fps: ' + Math.floor(frameRate()), 50, 50)

    fill(255)
    text(redTroops.length, width / 4, height / 2)

    fill(255)
    text(blueTroops.length, width * 3 / 4, height / 2)
    pop()
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
    if (!panning) {
        if (mouseX < width / 2) {
            // redTroops.push(new Archer(mouseX, mouseY, redProjectiles))
            redTroops.push(new Soldier(mouseX, mouseY, 'red'))
        } else {
            // blueTroops.push(new Archer(mouseX, mouseY, blueProjectiles))
            blueTroops.push(new Soldier(mouseX, mouseY, 'blue'))
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

function keyTyped() {
    if (key == ' ') {
        battling = !battling;
    }
    if (key == 'c') {
        redTroops = []
        blueTroops = []
        battling = false;
    }
}
