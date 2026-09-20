// Shared ember particle pool for fire effects — kept as plain objects, drawn flat.
let emberParticles = []

function spawnEmbers(x, y, count, size) {
    for (let i = 0; i < count; i++) {
        emberParticles.push({
            x: x + random(-size / 2, size / 2),
            y: y + random(-size / 2, size / 2),
            vx: random(-0.6, 0.6),
            vy: random(-1.2, -0.3),
            a: 255,
            s: random(size / 8, size / 4),
        })
    }
}

function updateEmbers() {
    if (!emberParticles.length) return
    noStroke()
    for (let i = emberParticles.length - 1; i >= 0; i--) {
        const p = emberParticles[i]
        fill(255, 120 + p.a / 3, 40, p.a)
        ellipse(p.x, p.y, p.s * p.a / 255)
        p.x += p.vx
        p.y += p.vy
        p.a -= 6
        if (p.a <= 0) {
            emberParticles.splice(i, 1)
        }
    }
}
