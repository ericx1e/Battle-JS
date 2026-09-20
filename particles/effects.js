// Minimal juice: expanding rings for deaths and casts.
// Everything is flat strokes in team colors — no glows, no sprites.

let effectRings = []

function spawnRing(x, y, team, size) {
    if (effectRings.length > 300) return // cap so mass deaths can't tank the frame
    effectRings.push({ x, y, team, size, a: 120, r: size / 2 })
}

function updateRings() {
    if (!effectRings.length) return
    noFill()
    for (let i = effectRings.length - 1; i >= 0; i--) {
        const p = effectRings[i]
        if (p.team == 'red') {
            stroke(255, 150, 150, p.a)
        } else if (p.team == 'blue') {
            stroke(150, 150, 255, p.a)
        } else {
            stroke(255, 220, 120, p.a)
        }
        strokeWeight(p.size / 14 * p.a / 120 + 0.5)
        ellipse(p.x, p.y, p.r * 2)
        p.r += p.size / 12
        p.a -= 12
        if (p.a <= 0) {
            effectRings.splice(i, 1)
        }
    }
}
