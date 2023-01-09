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