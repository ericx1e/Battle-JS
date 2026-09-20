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

function updateGrid(redUnits, blueUnits) {
    beginGridFrame();
    placeTeamInGrid(redUnits);
    placeTeamInGrid(blueUnits);
}

function placeTeamInGrid(units) {
    const cs = cellSize;

    for (let i = 0; i < units.length; i++) {
        const u = units[i];
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
    const dTarget2 = distSquared(unit.pos, unit.target.pos)
    if (dTarget2 > sqr(unit.attackRange * 0.9 + reachBonus(unit.target))) {
        let spd = unit.speed
        let dy = unit.target.pos.y - unit.pos.y
        if (dTarget2 > sqr(width / 8)) {
            // melee charge: sprint while the fight is still far away, so archers
            // don't get a free minute of volleys during the approach
            if (unit.attackRange < unit.size * 5) {
                spd *= 1.4
            }
            // hold your file: while the enemy is distant, advance as a broad
            // line (damped sideways drift) instead of funneling into one clump.
            // full convergence resumes near contact.
            dy *= 0.08
        }
        unit.vel.set(unit.target.pos.x - unit.pos.x, dy).limit(spd)
        unit.pos.add(unit.vel)
        stampHeading(unit)
    }
    checkUnitCollision(unit)
    checkBoundaries(unit)
    // if (this.isColliding(others)) {
    //     this.pos.sub(this.vel.mult(random(0.5, 3)))
    // }
}

// units LOOK where they WALK. a fresh heading (stamped by actual movement this
// frame or last) wins; otherwise face the target — standing troops aim at the
// enemy, and kiting archers keep facing forward because kiting never stamps.
function stampHeading(unit) {
    unit._heading = atan2(unit.vel.y, unit.vel.x)
    unit._headingFrame = frameCount
}

function unitFacing(u) {
    let desired
    if (u._headingFrame >= frameCount - 1) desired = u._heading
    else desired = atan2(u.target.pos.y - u.pos.y, u.target.pos.x - u.pos.x)

    // ease toward the desired angle along the shortest arc, so retargeting and
    // course changes read as a WHEEL instead of a snap. a stale facing (just
    // spawned, or not drawn for a while) snaps straight to the new direction.
    if (u._facing === undefined || frameCount - u._facingFrame > 10) {
        u._facing = desired
    } else if (u._facingFrame < frameCount) { // turn once per frame (attack + draw may both ask)
        let d = (desired - u._facing) % TWO_PI
        if (d > PI) d -= TWO_PI
        if (d < -PI) d += TWO_PI
        u._facing += d * 0.2
        // keep the accumulator wrapped so orbiting a target can't wind it up
        if (u._facing > PI) u._facing -= TWO_PI
        if (u._facing < -PI) u._facing += TWO_PI
    }
    u._facingFrame = frameCount
    return u._facing
}

function isBraced(unit) {
    return unit.name == 'shield' || unit.name == 'castlewall' || unit.name == 'phalanx' || unit.name == 'keep' || unit.name == 'knight'
}

// ranged units back away from anything that gets close, but backpedaling is
// slow (60% speed) — determined melee WILL close the gap. they keep firing
// while they give ground. returns true if the unit kited this frame.
function rangedKite(unit) {
    if (!unit.maxSpeed) return false
    const comfort = unit.attackRange * 0.22
    const foeTeam = unit.team == 'red' ? 'blue' : 'red'
    const near = checkTeamCollision(unit.pos, comfort, foeTeam)
    if (!near.length) return false
    let nearest = near[0]
    let best = Infinity
    for (let i = 0; i < near.length; i++) {
        const d2 = distSquared(unit.pos, near[i].pos)
        if (d2 < best) { best = d2; nearest = near[i] }
    }
    unit.vel.set(unit.pos.x - nearest.pos.x, unit.pos.y - nearest.pos.y).limit(unit.speed * 0.6)
    unit.pos.add(unit.vel)
    checkUnitCollision(unit)
    checkBoundaries(unit)
    return true
}

// shove a unit directly AWAY from the source of the blow (not along its own
// velocity — that could fling it anywhere). braced/immovable units hold.
// strength is in victim-sizes; the negative speed is a stagger the unit must
// recover from before it can close back in.
function knockbackUnit(unit, fromPos, strength = 1) {
    if (isBraced(unit) || isImmovable(unit) || !unit.maxSpeed) {
        return // braced units hold their ground
    }
    const away = p5.Vector.sub(unit.pos, fromPos)
    if (away.magSq() < 1e-9) away.set(1, 0)
    unit.pos.add(away.setMag(unit.size * strength))
    // stagger scales with the blow: speed recovers at maxSpeed/100 per frame,
    // so a full-strength stagger costs ~1s of recoil, a light shove far less
    unit.speed = min(unit.speed, -unit.maxSpeed / 2 * min(strength, 1))
    checkUnitCollision(unit)
    checkBoundaries(unit)
}

function moveUnitTowards(unit, dest) {
    if (distSquared(unit.pos, dest) > sqr(unit.attackRange * 0.9)) {
        unit.vel.set(dest.x - unit.pos.x, dest.y - unit.pos.y).limit(unit.speed)
        unit.pos.add(unit.vel)
        stampHeading(unit)
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
    // a reaver mid-leap is flying above the collision plane — nothing on the
    // ground can shove it off course
    return e && (e.name === 'shield' || e.name === 'castlewall' || e.name === 'wall' || e.name === 'keep' || e.name === 'barracks' || (e.name === 'reaver' && e._leaping > 0));
}

// structures are hit at their EDGE: a wall's body is wider than a melee unit's
// whole attack range, so a center-distance range check could never pass — the
// troop would stand at the wall grinding forever without landing a blow.
function isStructure(e) {
    return e && (e.name === 'castlewall' || e.name === 'wall' || e.name === 'keep' || e.name === 'barracks');
}

function reachBonus(target) {
    return isStructure(target) ? target.size / 2 : 0
}

function isProtectedFrom(target, pusher) {
    // target should NOT be pushed by pusher
    if (!target || !pusher) return false;
    if (!isImmovable(pusher) && isImmovable(target)) return true;
    if (target.name === 'summoner' && pusher.name === 'zombie') return true; // zombies can't shove summoners
    // a charger with momentum BREAKS THROUGH its own crowd — friendly bodies
    // part for the horse instead of boxing it in behind the line. enemy
    // bodies still block it (soldier walls stay the intended counter), and
    // so does masonry: no horse shoves a castle wall out of its lane.
    if (target.name === 'charger' && target.gallop >= 20 && target.team === pusher.team && !isImmovable(pusher)) return true;
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
        unit.pos.x -= unit.size / 2
    }
    if (unit.pos.x < 0) {
        unit.pos.x += unit.size / 2
    }
    if (unit.pos.y > height) {
        unit.pos.y -= unit.size / 2
    }
    if (unit.pos.y < 0) {
        unit.pos.y += unit.size / 2
    }
}