function updateTarget(unit, foes) {
    if (unit.target && unit.target !== unit && !unit.target.isDead) {
        // Soft leash to prevent constant target swapping
        const leashR = (unit.attackRange || (width / 40)) * 6
        if (distSquared(unit.pos, unit.target.pos) < leashR * leashR) return
    }

    updateToClosestTarget(unit, foes)
}

// function updateTarget(unit, foes) { // TODO: integrate spacial grid ?
//     if (unit.target == unit || unit.target.isDead) {
//         closestScan(unit, foes)
//     }
// }

function updateToClosestTarget(unit, foes) {
    if (!spacialGrid || !spacialGrid.length) {
        return closestScan(unit, foes)
    }
    const base = unit.attackRange || (width / 40)
    const searchRadius = Math.min(Math.max(base * 6, width / 20), Math.hypot(width, height));

    const minCol0 = Math.floor((unit.pos.x - searchRadius) / cellSize);
    const maxCol0 = Math.floor((unit.pos.x + searchRadius) / cellSize);
    const minRow0 = Math.floor((unit.pos.y - searchRadius) / cellSize);
    const maxRow0 = Math.floor((unit.pos.y + searchRadius) / cellSize);

    const cols = spacialGrid.length;
    const rows = spacialGrid[0].length;

    const minCol = Math.max(0, minCol0);
    const maxCol = Math.min(cols - 1, maxCol0);
    const minRow = Math.max(0, minRow0);
    const maxRow = Math.min(rows - 1, maxRow0);

    const foeTeam = (unit.team === 'red') ? 'blue' : 'red';

    let best = null;
    let bestD2 = Infinity;
    const r2 = searchRadius * searchRadius;

    for (let c = minCol; c <= maxCol; c++) {
        const col = spacialGrid[c];
        for (let r = minRow; r <= maxRow; r++) {
            const cell = col[r];
            if (!cell || cell.stamp !== gridFrame) continue; // only cells touched this frame

            const arr = (foeTeam === 'red') ? cell.red : cell.blue;

            for (let i = 0; i < cell.length; i++) {
                const other = arr[i];
                if (other === unit || other.isDead) continue;
                if (other.team === unit.team) continue;

                // Exact circle check
                const d2 = distSquared(unit.pos, other.pos);
                if (d2 > r2) continue;

                if (d2 < bestD2) { bestD2 = d2; best = other; }
            }
        }
    }

    if (best) {
        unit.target = best;
    } else {
        closestScan(unit, foes);
    }
}

function closestScan(unit, foes) {
    if (!foes.length) { unit.target = unit; return }
    let target = null
    let best = Infinity
    for (let i = 0; i < foes.length; i++) {
        const f = foes[i]
        if (f.isDead) continue
        const d = distSquared(unit.pos, f.pos)
        if (d < best) { best = d; target = f }
    }
    unit.target = target || unit
}


// function closestScan(unit, foes) {
//     if (foes.length) {
//         unit.target = foes[0]
//         let targetDist = distSquared(unit.pos, unit.target.pos)
//         foes.forEach(foe => {
//             if (!foe.isDead) {
//                 let dist = distSquared(unit.pos, foe.pos)
//                 if (dist < targetDist) {
//                     unit.target = foe
//                     targetDist = dist
//                 }
//             }
//         })
//     } else {
//         unit.target = unit
//     }
// }