let redTroops = []
let blueTroops = []
let panX = 0
let panY = 0
let zoom;
let battling = false
let canZoom = false

let troopId = 0

let buttons = []

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL)
    canvas.position(0, 0)
    zoom = (height / 2) / tan(PI / 6)
}

function draw() {
    background(51)
    if (canZoom) {
        camera(-panX, -panY, zoom, -panX, -panY, 0, 0, 1, 0)
    }
    // text('fps: ' + Math.floor(frameRate()), 50, 50)
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
    pop()
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
            redTroops.push(new Archer(mouseX, mouseY))
            redTroops.push(new Soldier(mouseX, mouseY))
        } else {
            blueTroops.push(new Archer(mouseX, mouseY))
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
