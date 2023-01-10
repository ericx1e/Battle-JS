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
            }
            break;
        case 'blue':
            if (tranparency) {
                fill(120, 120, 255, tranparency)
                stroke(150, 150, 255, tranparency)
            } else {
                fill(120, 120, 255, 150)
                stroke(150, 150, 255)
            }
            break;
    }
}

function distSquared(x, y, x1, y1) { //faster than sqrt
    let dx = x1 - x;
    let dy = y1 - y;
    return dx * dx + dy * dy;
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

    for (let i = 0; i < 100; i++) {
        troops.push(new Soldier(offset + mult * random(buffer, width / 2 - buffer), random(buffer, height - buffer), team))
    }
}