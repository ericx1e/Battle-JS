const _colBuf = [];

let gridFrame = 0;
function makeCell() { return { stamp: 0, red: [], blue: [] }; }

function ensureCell(c, r) {
    const cols = spacialGrid;
    let col = cols[c];
    if (!col) col = cols[c] = [];
    let cell = col[r];
    if (!cell) cell = col[r] = makeCell();
    return cell;
}

function touchCell(cell) {
    if (cell.stamp !== gridFrame) {
        cell.stamp = gridFrame;
        cell.red.length = 0;
        cell.blue.length = 0;
    }
    return cell;
}

function beginGridFrame() {
    gridFrame++;
}

function setupGrid() {
    let cols = ceil(width / cellSize);
    let rows = ceil(height / cellSize);
    spacialGrid = new Array(cols);
    for (let i = 0; i < cols; i++) {
        spacialGrid[i] = new Array(rows);
    }
}

function placeUnitInGrid(unit) {
    let col = floor(unit.pos.x / cellSize);
    let row = floor(unit.pos.y / cellSize);

    if (col >= 0 && col < spacialGrid.length && row >= 0 && row < spacialGrid[0].length) {
        spacialGrid[col][row].push(unit);
    }
}

// function updateGrid(units) {
//     // Clear the grid
//     setupGrid();

//     // Place all units in their respective cells
//     units.forEach(unit => {
//         placeUnitInGrid(unit);
//     });
// }

function updateGrid(allUnits) {
    beginGridFrame();
    const cs = cellSize;

    for (let i = 0; i < allUnits.length; i++) {
        const u = allUnits[i];
        if (!u || u.isDead) continue;

        const r = (u.size || 0) * 0.5;
        const minC = Math.max(0, Math.floor((u.pos.x - r) / cs));
        const maxC = Math.min(spacialGrid.length - 1, Math.floor((u.pos.x + r) / cs));
        const minR = Math.max(0, Math.floor((u.pos.y - r) / cs));
        const maxR = Math.min(spacialGrid[0].length - 1, Math.floor((u.pos.y + r) / cs));


        for (let c = minC; c <= maxC; c++) {
            const col = spacialGrid[c];
            for (let rIdx = minR; rIdx <= maxR; rIdx++) {
                const cell = touchCell(col[rIdx] || (col[rIdx] = makeCell()));
                (u.team === 'red' ? cell.red : cell.blue).push(u);
            }
        }
    }
}

function moveUnit(unit) {
    if (!unit.target || !unit.target.pos) {
        unit.target = unit;
        if (!unit.retreating) {
            return;
        }
    }
    if (unit.retreating) {
        unit.pos.add(unit.vel)
    }
    if (distSquared(unit.pos, unit.target.pos) > sqr(unit.attackRange * 0.9)) {
        unit.vel = p5.Vector.sub(unit.target.pos, unit.pos).limit(unit.speed)
        unit.pos.add(unit.vel)
    }
    checkUnitCollision(unit)
    checkBoundaries(unit)
    // if (this.isColliding(others)) {
    //     this.pos.sub(this.vel.mult(random(0.5, 3)))
    // }
}

function knockbackUnit(unit) {
    if (unit.name == 'shield' || unit.name == 'castlewall') {
        return
    }
    // let moveVector = p5.Vector.sub(foe.pos, this.pos).setMag(foe.speed * 2)
    // foe.pos.add(moveVector)
    unit.pos.add(p5.Vector.mult(unit.vel, -2))
    unit.speed = -unit.maxSpeed / 2
    moveUnit(unit)
}

function moveUnitTowards(unit, dest) {
    if (distSquared(unit.pos, dest) > sqr(unit.attackRange * 0.9)) {
        unit.vel = p5.Vector.sub(dest, unit.pos).limit(unit.speed)
        unit.pos.add(unit.vel)
    }
    checkUnitCollision(unit)
    checkBoundaries(unit)
}

function checkTeamCollision(sourcePos, radius, targetTeam) {
    _colBuf.length = 0;

    // Calculate the grid bounds (min and max rows and columns) to check based on the radius
    let minCol = floor((sourcePos.x - radius) / cellSize);
    let maxCol = floor((sourcePos.x + radius) / cellSize);
    let minRow = floor((sourcePos.y - radius) / cellSize);
    let maxRow = floor((sourcePos.y + radius) / cellSize);

    // Ensure bounds are within the grid limits
    minCol = max(minCol, 0);
    maxCol = min(maxCol, spacialGrid.length - 1);
    minRow = max(minRow, 0);
    maxRow = min(maxRow, spacialGrid[0].length - 1);

    // Loop through relevant grid cells within the radius
    for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
            let cell = spacialGrid[col][row];
            if (!cell || cell.stamp !== gridFrame) continue;        // untouched this frame
            const cellUnits = targetTeam === 'red' ? cell.red : cell.blue;

            // Check each unit in the current grid cell
            for (let i = 0; i < cellUnits.length; i++) {
                const other = cellUnits[i];
                if (other.isDead) continue;

                // Calculate the actual distance squared between the source and the other unit
                let distanceSquared = distSquared(sourcePos, other.pos);
                let collisionDist = sqr(radius + other.size / 2);  // sum of radii for the collision

                // If distance between source and other is within collision radius
                if (distanceSquared <= collisionDist) {
                    _colBuf.push(other)
                }
            }
        }
    }

    return _colBuf;
}


function checkCollision(sourcePos, radius) {
    _colBuf.length = 0;
    // Calculate the grid bounds (min and max rows and columns) to check based on the radius
    let minCol = floor((sourcePos.x - radius) / cellSize);
    let maxCol = floor((sourcePos.x + radius) / cellSize);
    let minRow = floor((sourcePos.y - radius) / cellSize);
    let maxRow = floor((sourcePos.y + radius) / cellSize);

    // Ensure bounds are within the grid limits
    minCol = max(minCol, 0);
    maxCol = min(maxCol, spacialGrid.length - 1);
    minRow = max(minRow, 0);
    maxRow = min(maxRow, spacialGrid[0].length - 1);

    // Loop through relevant grid cells within the radius
    for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
            let cell = spacialGrid[col][row];
            if (!cell || cell.stamp !== gridFrame) continue;

            // red bucket
            for (let i = 0; i < cell.red.length; i++) {
                const other = cell.red[i];
                if (!other || other.isDead) continue;
                const dx = other.pos.x - sourcePos.x;
                const dy = other.pos.y - sourcePos.y;
                const sumR = radius + other.size / 2;
                if (dx * dx + dy * dy <= sumR * sumR) _colBuf.push(other);
            }
            // blue bucket
            for (let i = 0; i < cell.blue.length; i++) {
                const other = cell.blue[i];
                if (!other || other.isDead) continue;
                const dx = other.pos.x - sourcePos.x;
                const dy = other.pos.y - sourcePos.y;
                const sumR = radius + other.size / 2;
                if (dx * dx + dy * dy <= sumR * sumR) _colBuf.push(other);
            }
        }
    }

    return _colBuf;
}


function isImmovable(e) {
    return e && (e.name === 'shield' || e.name === 'castlewall' || e.name === 'wall');
}

function isProtectedFrom(target, pusher) {
    // target should NOT be pushed by pusher
    if (!target || !pusher) return false;
    if (!isImmovable(pusher) && isImmovable(target)) return true;
    if (target.name === 'summoner' && pusher.name === 'zombie') return true; // zombies can't shove summoners
    return false;
}

function sepCorrection(unit, other, minDist, d2) {
    // returns {ux,uy, ox,oy} displacement to apply this frame (can be zero for either side)
    const dx = unit.pos.x - other.pos.x;
    const dy = unit.pos.y - other.pos.y;

    // handle exact overlap (d2==0) with a stable nudge to avoid NaN
    let nx, ny, d;
    if (d2 <= 1e-9) {
        // deterministic small axis to avoid random jitter
        nx = 0.70710678; ny = 0.70710678; d = 0.000001;
    } else {
        d = Math.sqrt(d2);
        nx = dx / d; ny = dy / d;
    }

    const penetration = Math.max(0, minDist - d);
    if (penetration <= 0) return { ux: 0, uy: 0, ox: 0, oy: 0 };

    // weights: who moves how much
    let wU = 1, wO = 1;

    if (isProtectedFrom(unit, other)) {           // unit is protected from other → move other only
        wU = 0; wO = 1;
    } else if (isProtectedFrom(other, unit)) {    // other is protected from unit → move unit only
        wU = 1; wO = 0;
    } else if (isImmovable(unit) && isImmovable(other)) {
        // both immovable: nudge unit only to avoid deadlock (tiny)
        wU = 1; wO = 0;
    } else if (isImmovable(unit)) {
        wU = 0; wO = 1;
    } else if (isImmovable(other)) {
        wU = 1; wO = 0;
    } else {
        // both movable, split correction but bias a bit to "me" so I feel responsive
        wU = 0.6; wO = 0.4;
    }

    // damp correction to avoid rubber-banding; cap per-frame displacement
    // (feels smoother than fully resolving penetration in one go)
    const corr = Math.min(penetration * 0.6, (unit.maxSpeed || 2)); // tweak 0.6 if you want stiffer/softer
    const sumW = (wU + wO) || 1;

    const ux = nx * corr * (wU / sumW);
    const uy = ny * corr * (wU / sumW);
    const ox = -nx * corr * (wO / sumW);
    const oy = -ny * corr * (wO / sumW);

    return { ux, uy, ox, oy };
}


function checkUnitCollision(unit) {
    const col = floor(unit.pos.x / cellSize);
    const row = floor(unit.pos.y / cellSize);

    // accumulate only my displacement; apply other’s directly (with a once-per-frame guard)
    let accUx = 0, accUy = 0;

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const cc = col + i, rr = row + j;
            if (cc < 0 || rr < 0 || cc >= spacialGrid.length || rr >= spacialGrid[0].length) continue;

            const cell = spacialGrid[cc][rr];
            if (!cell || cell.stamp !== gridFrame) continue;

            const scan = (arr) => {
                for (let k = 0; k < arr.length; k++) {
                    const other = arr[k];
                    if (!other || other.isDead || other === unit) continue;

                    const minDist = unit.size * 0.5 + other.size * 0.5;
                    const dx = unit.pos.x - other.pos.x;
                    const dy = unit.pos.y - other.pos.y;
                    const d2 = dx * dx + dy * dy;

                    if (d2 < minDist * minDist) {
                        const { ux, uy, ox, oy } = sepCorrection(unit, other, minDist, d2);

                        // accumulate my move; apply a small clamp for safety
                        accUx += ux; accUy += uy;

                        // push the other at most once per frame to reduce ping-pong jitter
                        if ((ox !== 0 || oy !== 0) && other._pushedFrame !== gridFrame) {
                            other._pushedFrame = gridFrame;
                            other.pos.x += ox; other.pos.y += oy;
                        }
                    }
                }
            };
            scan(cell.red);
            scan(cell.blue);
        }
    }

    // apply my accumulated correction in one go (smoother than many tiny nudges)
    if (accUx || accUy) {
        // optional clamp so we never overstep wildly
        const maxStep = (unit.maxSpeed || 2) * 1.25;
        const mag2 = accUx * accUx + accUy * accUy;
        if (mag2 > maxStep * maxStep) {
            const m = Math.sqrt(mag2);
            accUx = accUx * (maxStep / m);
            accUy = accUy * (maxStep / m);
        }
        unit.pos.x += accUx;
        unit.pos.y += accUy;
    }
}


function checkBoundaries(unit) {
    if (unit.pos.x > width) {
        unit.pos.add(createVector(-unit.size / 2, 0))
    }
    if (unit.pos.x < 0) {
        unit.pos.add(createVector(unit.size / 2, 0))
    }
    if (unit.pos.y > height) {
        unit.pos.add(createVector(0, -unit.size / 2))
    }
    if (unit.pos.y < 0) {
        unit.pos.add(createVector(0, unit.size / 2))
    }
}