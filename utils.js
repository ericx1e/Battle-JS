// swing motion: a real cut instead of a snap-and-drift. the blade PULLS BACK
// (wind-up), whips THROUGH the arc in a few violent frames, then a heavy
// follow-through eases back to guard. t counts frames since the blow landed;
// returns the weapon's angle offset (negative = wound back).
function swingCurve(t, peak, windup, snap, recover) {
    if (t === undefined || t < 0) return 0
    if (t < windup) return -peak * 0.35 * (t / windup)
    if (t < windup + snap) return -peak * 0.35 + peak * 1.35 * ((t - windup) / snap)
    const r = (t - windup - snap) / recover
    if (r >= 1) return 0
    return peak * (1 - r) * (1 - r)
}

// swing juice: a fading streak along the arc the weapon just carved. call
// inside the facing-rotated frame, BEFORE rotate(attackRotate). rot decays
// from ±peak back to 0 as the swing recovers; restAngle is where the blade
// points at rest; radius is roughly mid-blade. spans over 2π (reaper spins)
// render as full blur rings.
function drawSwingStreak(size, rot, peak, radius, restAngle) {
    const energy = peak ? abs(rot / peak) : 0
    if (energy <= 0.08) return
    const a0 = restAngle + min(rot, peak)
    const a1 = restAngle + max(rot, peak)
    noFill()
    stroke(255, 110 * energy)
    strokeWeight(size / 7)
    arc(0, 0, radius * 2, radius * 2, a0, a1)
    stroke(255, 45 * energy)
    strokeWeight(size / 12)
    arc(0, 0, radius * 2.3, radius * 2.3, a0, a1)
}

// troops STAND on the field: the body is drawn a little above its ground
// position with a shadow at the feet — the same ground/air separation the
// ballistic arrows use, so bows loose into the plane the bodies live in
function bodyLift(size) {
    return size * 0.28
}

function drawUnitShadow(size) {
    noStroke()
    fill(0, 100)
    ellipse(0, size * 0.35, size * 1.15, size * 0.5)
}

// shadow pass: in a massed line, every shadow goes down BEFORE any body is
// drawn, so a unit's shadow never lands on top of a neighbor's back. troops
// stamped here skip their own inline shadow this frame; structures draw
// their own footprint shading.
function drawTroopShadows(troops) {
    for (let i = 0; i < troops.length; i++) {
        const t = troops[i]
        if (!t || isStructure(t)) continue
        push()
        translate(t.pos.x, t.pos.y)
        drawUnitShadow(t.size)
        pop()
        t._shadowFrame = frameCount
    }
}

function drawSettings(color, tranparency, size) {
    // drawingContext.setLineDash([])
    if (size) {
        strokeWeight(size / 10)
    } else {
        strokeWeight(width / 1000)
    }
    colorMode(RGB)
    switch (color) {
        case 'red':
            if (tranparency) {
                fill(255, 120, 120, tranparency)
                stroke(255, 150, 150, tranparency)
            } else {
                fill(255, 120, 120, 150)
                stroke(255, 150, 150)
                // fill(0, 150)
                // stroke(0)
            }
            break;
        case 'blue':
            if (tranparency) {
                fill(120, 120, 255, tranparency)
                stroke(150, 150, 255, tranparency)
            } else {
                fill(120, 120, 255, 150)
                stroke(150, 150, 255)
                // fill(255, 150)
                // stroke(255)
            }
            break;
    }
}

function distSquaredVal(x, y, x1, y1) { //faster than sqrt
    let dx = x1 - x;
    let dy = y1 - y;
    return dx * dx + dy * dy;
}

// vectors — no allocation, this is the hottest function in the game
function distSquared(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return dx * dx + dy * dy;
}

function sqr(n) {
    return n * n
}

function cb(n) {
    return n * n * n
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

// single factory for every troop type — used by menus, shops, ghosts, and spawners
function makeTroop(name, x, y, team) {
    let troop
    switch (name) {
        case 'soldier': troop = new Soldier(x, y, team); break
        case 'archer': troop = new Archer(x, y, team); break
        case 'spear': troop = new Spear(x, y, team); break
        case 'phalanx': troop = new Phalanx(x, y, team); break
        case 'knight': troop = new Knight(x, y, team); break
        case 'necromancer': troop = new Necromancer(x, y, team); break
        case 'summoner': troop = new Summoner(x, y, team); break
        case 'ewizard': troop = new EWizard(x, y, team); break
        case 'fwizard': troop = new FWizard(x, y, team); break
        case 'warlock': troop = new Warlock(x, y, team); break
        case 'shield': troop = new Shield(x, y, team); break
        case 'charger': troop = new Charger(x, y, team); break
        case 'reaver': troop = new Reaver(x, y, team); break
        case 'reaper': troop = new Reaper(x, y, team); break
        case 'zombie': troop = new Zombie(x, y, team); break
        case 'castlewall': troop = new CastleWall(x, y, team); break
        case 'keep': troop = new Keep(x, y, team); break
    }
    if (troop && typeof applyUnitBuffs === 'function') {
        applyUnitBuffs(troop) // autochess: red troops pick up owned buffs (covers mid-battle summons too)
    }
    return troop
}

function weightedPick(list) {
    if (!list.length) return undefined
    let total = 0
    list.forEach(e => total += e.weight)
    let roll = random(0, total)
    for (const e of list) {
        roll -= e.weight
        if (roll <= 0) return e
    }
    return list[list.length - 1]
}

function randomTroops(team) {
    let buffer = width / 30
    let offset = width / 2
    let mult = team == 'red' ? -1 : 1
    troops = team == 'red' ? redTroops : blueTroops
    for (let i = 0; i < 200; i++) {
        troops.push(new Soldier(offset + mult * random(buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 5; i++) {
        troops.push(new CastleWall(offset + mult * random(buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 40; i++) {
        troops.push(new Shield(offset + mult * random(buffer / 2, buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 7; i++) {
        troops.push(new Spear(offset + mult * random(buffer, buffer * 3 / 2), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 15; i++) {
        troops.push(new Phalanx(offset + mult * random(buffer / 2, buffer * 3 / 2), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 10; i++) {
        troops.push(new Reaper(offset + mult * random(buffer, buffer * 2), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 25; i++) {
        troops.push(new Archer(offset + mult * random(offset - 3 * buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 2; i++) {
        troops.push(new EWizard(offset + mult * random(offset - 3 * buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 2; i++) {
        troops.push(new FWizard(offset + mult * random(offset - 3 * buffer, offset - buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 2; i++) {
        troops.push(new Summoner(offset + mult * random(offset - 4 * buffer, offset - 3 * buffer), random(buffer, height - buffer), team))
    }
    for (let i = 0; i < 1; i++) {
        troops.push(new Necromancer(offset + mult * random(offset - 6 * buffer, offset - 4 * buffer), random(buffer, height - buffer), team))
    }
}

// full-screen banner for round results — shared by campaign, autochess, siege
function drawBanner(title, subtitle) {
    rectMode(CORNER)
    noStroke()
    fill(0, 130)
    rect(0, 0, width, height)
    fill(255)
    textAlign(CENTER, CENTER)
    textSize(width / 12)
    text(title, width / 2, height / 2 - width / 40)
    if (subtitle) {
        textSize(width / 40)
        fill(255, 200)
        text(subtitle, width / 2, height / 2 + width / 20)
    }
}

// ---------- persistence ----------
const SAVE_KEY = 'battledots_save'

function saveProgress() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            levelsComplete: levels.map(l => l.complete),
            autochessBest: autochessBestStage,
            siegeBest: siege.bestWave,
        }))
    } catch (e) { /* storage unavailable (private mode etc.) — play on without saving */ }
}

function loadProgress() {
    try {
        const data = JSON.parse(localStorage.getItem(SAVE_KEY))
        if (!data) return
        if (data.levelsComplete) {
            for (let i = 0; i < levels.length; i++) {
                levels[i].complete = !!data.levelsComplete[i]
                if (levels[i].complete) {
                    levels[i].locked = false
                    if (levels[i + 1]) levels[i + 1].locked = false
                }
            }
        }
        if (data.autochessBest) {
            autochessBestStage = data.autochessBest
        }
        if (data.siegeBest) {
            siege.bestWave = data.siegeBest
        }
    } catch (e) { /* corrupt or unavailable save — start fresh */ }
}

function changeScreen(newScreen) {
    clearTroops()
    switch (newScreen) {
        case 'title':
            break
        case 'level_select':
            break
        case 'versus_lobby':
            lobbyName = ""
            break
        case 'game':
            menu = new Menu()
            newTroopId = undefined
            erasing = false
            // randomSeed(1)
            if (mode == 'autochess') {
                autochessEngine = new AutochessEngine()
            }
            if (mode == 'siege') {
                initSiege()
            }
            break
    }

    screen = newScreen
}