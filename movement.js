function setupGrid() {
    let cols = ceil(width / cellSize);
    let rows = ceil(height / cellSize);
    spacialGrid = new Array(cols);
    for (let i = 0; i < cols; i++) {
        spacialGrid[i] = new Array(rows);
        for (let j = 0; j < rows; j++) {
            spacialGrid[i][j] = [];
        }
    }
}

function placeUnitInGrid(unit) {
    let col = floor(unit.pos.x / cellSize);
    let row = floor(unit.pos.y / cellSize);

    if (col >= 0 && col < spacialGrid.length && row >= 0 && row < spacialGrid[0].length) {
        spacialGrid[col][row].push(unit);
    }
}

function updateGrid(units) {
    // Clear the grid
    setupGrid();

    // Place all units in their respective cells
    units.forEach(unit => {
        placeUnitInGrid(unit);
    });
}

function moveUnit(unit) {
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

function checkCollision(sourcePos, radius, targetTeam) {
    // Calculate the grid bounds (min and max rows and columns) to check based on the radius
    let minCol = floor((sourcePos.x - radius) / cellSize) - 1;
    let maxCol = floor((sourcePos.x + radius) / cellSize) + 1;
    let minRow = floor((sourcePos.y - radius) / cellSize) - 1;
    let maxRow = floor((sourcePos.y + radius) / cellSize) + 1;

    // Ensure bounds are within the grid limits
    minCol = max(minCol, 0);
    maxCol = min(maxCol, spacialGrid.length - 1);
    minRow = max(minRow, 0);
    maxRow = min(maxRow, spacialGrid[0].length - 1);

    // Loop through relevant grid cells within the radius
    collided = []
    for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
            let cellUnits = spacialGrid[col][row];

            // Check each unit in the current grid cell
            for (let i = 0; i < cellUnits.length; i++) {
                let other = cellUnits[i];

                if (other.team != targetTeam || other.isDead) continue;

                // Calculate the actual distance squared between the source and the other unit
                let distanceSquared = distSquared(sourcePos, other.pos);
                let collisionDist = sqr(radius + other.size / 2);  // sum of radii for the collision

                // If distance between source and other is within collision radius
                if (distanceSquared <= collisionDist) {
                    collided.push(other)
                }
            }
        }
    }

    // No collision found
    return collided;
}

function checkUnitCollision(unit) {
    let squeezeVel = createVector(0, 0)

    let col = floor(unit.pos.x / cellSize);
    let row = floor(unit.pos.y / cellSize);

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let checkCol = col + i;
            let checkRow = row + j;

            if (checkCol >= 0 && checkCol < spacialGrid.length && checkRow >= 0 && checkRow < spacialGrid[0].length) {
                let cellUnits = spacialGrid[checkCol][checkRow];

                for (let k = 0; k < cellUnits.length; k++) {
                    let other = cellUnits[k];
                    if (other.isDead || other == unit) continue;

                    let minDist = unit.size / 2 + other.size / 2;
                    if (distSquared(unit.pos, other.pos) < sqr(minDist)) {
                        let moveVector = p5.Vector.sub(unit.pos, other.pos).limit(unit.maxSpeed * 0.75);
                        squeezeVel.add(moveVector);
                        if (!(unit.name == 'zombie' && other.name == 'summoner')) {
                            other.pos.sub(moveVector);
                        }
                    }
                }
            }
        }
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