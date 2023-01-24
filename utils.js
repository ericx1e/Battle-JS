function drawSettings(color, tranparency) {
    // drawingContext.setLineDash([])
    strokeWeight(width / 1000)
    colorMode(RGB)
    switch (color) {
        case 'red':
            if (tranparency) {
                fill(255, 120, 120, tranparency)
                stroke(255, 150, 150, tranparency)
            } else {
                fill(255, 120, 120, 150)
                stroke(255, 150, 150)
                // fill(0, 150)
                // stroke(0)
            }
            break;
        case 'blue':
            if (tranparency) {
                fill(120, 120, 255, tranparency)
                stroke(150, 150, 255, tranparency)
            } else {
                fill(120, 120, 255, 150)
                stroke(150, 150, 255)
                // fill(255, 150)
                // stroke(255)
            }
            break;
    }
}

function distSquaredVal(x, y, x1, y1) { //faster than sqrt
    let dx = x1 - x;
    let dy = y1 - y;
    return dx * dx + dy * dy;
}

// vectors
function distSquared(a, b) {
    return p5.Vector.sub(a, b).magSq()
}

function sqr(n) {
    return n * n
}

function cb(n) {
    return n * n * n
}

function lerp1(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

function clearTroops(team) {
    battling = false;
    if (team) {
        if (team == 'red') {
            redTroops = []
            redProjectiles = []
            redToRemove = []
        } else if (team == 'blue') {
            blueTroops = []
            blueProjectiles = []
            blueToRemove = []
        }
    } else {
        clearTroops('red')
        clearTroops('blue')
    }
}

function randomTroops(team) {
    let buffer = width / 30
    let offset = width / 2
    let mult = team == 'red' ? -1 : 1
    troops = team == 'red' ? redTroops : blueTroops

    for (let i = 0; i < 150; i++) {
        troops.push(new Soldier(offset + mult * random(buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 2; i++) {
        troops.push(new Healer(offset + mult * random(buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 40; i++) {
        troops.push(new Shield(offset + mult * random(buffer / 2, buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 7; i++) {
        troops.push(new Spear(offset + mult * random(buffer, buffer * 3 / 2), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 10; i++) {
        troops.push(new Reaper(offset + mult * random(buffer, buffer * 2), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 30; i++) {
        troops.push(new Archer(offset + mult * random(offset - 3 * buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 2; i++) {
        troops.push(new EWizard(offset + mult * random(offset - 3 * buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 2; i++) {
        troops.push(new Summoner(offset + mult * random(offset - 4 * buffer, offset - 3 * buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 1; i++) {
        troops.push(new Necromancer(offset + mult * random(offset - 6 * buffer, offset - 4 * buffer), random(buffer, height - buffer), team))
    }
}

function changeScreen(newScreen) {
    clearTroops()
    switch (newScreen) {
        case 'title':
            break
        case 'level_select':
            break
        case 'game':
            menu = new Menu()
            break
    }

    screen = newScreen
}