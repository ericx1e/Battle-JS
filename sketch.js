let redTroops = []
let redProjectiles = []
let blueTroops = []
let blueProjectiles = []
let panX = 0
let panY = 0
let zoom;
let battling = false
let canZoom = false

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

    for (let i = 0; i < 500; i++) {
        i % 2 == 0 ? redTroops.push(new Soldier(random(0, width), random(0, height))) : blueTroops.push(new Soldier(random(0, width), random(0, height)))
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

    for (let i = 0; i < blueTroops.length; i++) {
        troop = blueTroops[i];
        troop.show('blue')
        if (battling) {
            troop.update(blueTroops, redTroops)
            if (troop.isDead) {
                blueTroops.splice(i, 1)
                i--
            }
        }
    }

    updateProjectiles(blueProjectiles, redTroops)
    for (let i = 0; i < redTroops.length; i++) {
        troop = redTroops[i];
        troop.show('red')
        if (battling) {
            troop.update(redTroops, blueTroops)
            if (troop.isDead) {
                redTroops.splice(i, 1)
                i--
            }
        }
    }
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
            redTroops.push(new Soldier(mouseX, mouseY))
        } else {
            // blueTroops.push(new Archer(mouseX, mouseY, blueProjectiles))
            blueTroops.push(new Soldier(mouseX, mouseY))
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
