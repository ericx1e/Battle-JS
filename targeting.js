function updateTarget(unit, foes) {
    if (unit.target && unit.target !== unit && !unit.target.isDead && !isIgnoredTarget(unit, unit.target)) {
        const d2 = distSquared(unit.pos, unit.target.pos)

        // committed: already at grips with this target — never peel away
        // (structures count reach to their edge, or the wall would get
        // chase-broken and blacklisted while being actively attacked)
        if (d2 < sqr(unit.attackRange * 1.2 + reachBonus(unit.target))) {
            unit._chaseTarget = undefined
            return
        }

        // Soft leash to prevent constant target swapping…
        const leashR = (unit.attackRange || (width / 40)) * 6
        if (d2 < leashR * leashR) {
            // …but the leash BREAKS after a full second of chasing with zero
            // net progress. this is what kills bait cheese: you can't kite a
            // whole army around. (windowed check — robust to multiple calls per frame)
            if (unit._chaseTarget !== unit.target) {
                unit._chaseTarget = unit.target
                unit._chaseD2 = d2
                unit._chaseCheckFrame = battleFrameCount
                return
            }
            if (battleFrameCount - unit._chaseCheckFrame < 60) return
            if (d2 < unit._chaseD2 - 1) {
                // real progress — refresh the window and keep chasing
                unit._chaseD2 = d2
                unit._chaseCheckFrame = battleFrameCount
                return
            }
            // give up: blacklist the runner for a while and find a real fight
            unit._ignore = unit.target
            unit._ignoreUntil = battleFrameCount + 240
        }
    }

    unit._chaseTarget = undefined
    updateToClosestTarget(unit, foes)
}

function isIgnoredTarget(unit, other) {
    return unit._ignore === other && battleFrameCount < unit._ignoreUntil
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

            for (let i = 0; i < arr.length; i++) {
                const other = arr[i];
                if (other === unit || other.isDead) continue;
                if (other.team === unit.team) continue;
                if (isIgnoredTarget(unit, other)) continue;

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
        if (f.isDead || isIgnoredTarget(unit, f)) continue
        const d = distSquared(unit.pos, f.pos)
        if (d < best) { best = d; target = f }
    }
    if (!target) {
        // only blacklisted foes remain — grudgingly chase them after all
        unit._ignore = undefined
        for (let i = 0; i < foes.length; i++) {
            const f = foes[i]
            if (f.isDead) continue
            const d = distSquared(unit.pos, f.pos)
            if (d < best) { best = d; target = f }
        }
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