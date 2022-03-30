function drawSettings(color) {
    // drawingContext.setLineDash([])
    strokeWeight(width / 1000)
    switch (color) {
        case 'red':
            fill(255, 100, 100, 150)
            stroke(255, 100, 100)
            break;
        case 'blue':
            fill(100, 100, 255, 150)
            stroke(100, 100, 255)
            break;
    }
}

function distSquared(x, y, x1, y1) { //faster than sqrt
    let dx = x1 - x;
    let dy = y1 - y;
    return dx * dx + dy * dy;
}