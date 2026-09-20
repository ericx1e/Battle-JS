
let castleWalls = [];                // array of Wall segments
let castleAnchor = { x: 0, y: 0 };   // for coin magnet + generic targeting
let siegeKeep = null;                // the objective behind the walls


const siege = {
    wave: 0,
    nextWaveFrame: 0,
    interval: 60 * 16,   // max seconds between assaults; clearing early pulls the next one in
    aliveEnemies: 0,
    gold: 0,
    coins: [],           // coin drops
    running: false,
    gameOver: false,
    bestWave: 0,         // persisted record
    clearedPaid: false,  // early-clear bonus paid for this lull
    bonusShownUntil: 0,
    lastBonus: 0,
    lastInterest: 0,
    interestThisWave: 0, // interest already banked since the last wave spawned
    repairButton: null,
    barracks: [],       // the standing-army spawners (troops/barracks.js) — build more any time, no hard cap
    barracksBuildButton: null,
    barracksUpgradeButton: null,
};

// Barracks are spread across evenly-spaced slots down the FULL height of the
// wall (not clustered near one spot) and sit on the FRONT (east) face of the
// wall, same side as the muster ranks — a barracks built behind the wall (the
// courtyard, where the Keep sits) would have its own spawns walk face-first
// into the wall's collision trying to reach the fight; this way they're
// already on the battle side and never have to route around it.
const BARRACKS_Y_SLOTS = 6
// fill order maximizes spread at every PREFIX, not just the final set — top,
// bottom, middle, then quarters — so even 2-3 barracks already span the whole
// wall instead of clustering near wherever slot 0 happens to be
const BARRACKS_SLOT_ORDER = [0, 5, 2, 4, 1, 3]
const BARRACKS_BUILD_COST_MULT = 1.45 // each additional barracks costs more — the "build more" lever instead of a hard max

// interest stops accruing once this much has been banked in one wave's lull —
// income should come from FIGHTING, and stalling a straggler can't go infinite
const SIEGE_INTEREST_WAVE_CAP = 18

// active repair: one click, one chunk of masonry — your call when to spend
const SIEGE_REPAIR_COST = 50
const SIEGE_REPAIR_HP = SIEGE_REPAIR_COST * 40 // same 40hp/gold rate as before

// the Barracks: a permanent, upgradable spawner — the answer to "buying units
// feels temporary." Gold spent here compounds across every future wave
// instead of dying with the troops it bought once. No hard ceiling: once one
// is fully upgraded, the same button starts a NEW one instead of stopping —
// "build more" replaces "hit a max," per Eric.
function barracksLiving() {
    return siege.barracks.filter(b => b && !b.isDead)
}

// BUILD and UPGRADE are two separate, always-available actions (not one
// button that silently prioritizes upgrading existing barracks first) — that
// single-button version meant a 3rd barracks could never appear until BOTH
// existing ones were fully maxed (2 builds + up to 4 upgrades = 6 clicks),
// which read as "building more doesn't work past 2."
function barracksBuildCost() {
    const n = barracksLiving().length
    return Math.round(BARRACKS_TIERS[1].cost * Math.pow(BARRACKS_BUILD_COST_MULT, n) / 5) * 5
}

function barracksUpgradeTarget() {
    return barracksLiving().find(b => b.tier < BARRACKS_TIERS.length - 1) || null
}

function barracksSlotPos(index) {
    const slot = BARRACKS_SLOT_ORDER[index % BARRACKS_Y_SLOTS]
    return { x: castleAnchor.x + width * 0.02, y: height * (slot + 0.5) / BARRACKS_Y_SLOTS }
}

function doBuildBarracks() {
    if (siege.gameOver) return
    const cost = barracksBuildCost()
    if (siege.gold < cost) return
    siege.gold -= cost
    const pos = barracksSlotPos(barracksLiving().length)
    const b = new Barracks(pos.x, pos.y, 'red')
    siege.barracks.push(b)
    redTroops.push(b)
    spawnRing(b.pos.x, b.pos.y, 'red', b.size * 0.4)
}

function doUpgradeBarracks() {
    if (siege.gameOver) return
    const target = barracksUpgradeTarget()
    if (!target) return
    const cost = BARRACKS_TIERS[target.tier + 1].cost
    if (siege.gold < cost) return
    siege.gold -= cost
    target.upgrade()
    spawnRing(target.pos.x, target.pos.y, 'red', target.size * 0.4)
}

function siegeRepairTargets() {
    const targets = []
    if (siegeKeep && !siegeKeep.isDead && siegeKeep.hitpoints < siegeKeep.maxHitpoints) {
        targets.push(siegeKeep)
    }
    barracksLiving().forEach(b => {
        if (b.hitpoints < b.maxHitpoints) targets.push(b)
    })
    castleWalls.forEach(w => {
        if (w && !w.isDead && w.hitpoints > 0 && w.hitpoints < w.maxHitpoints) {
            targets.push(w)
        }
    })
    return targets
}

function doSiegeRepair() {
    if (siege.gold < SIEGE_REPAIR_COST || siege.gameOver) return
    const targets = siegeRepairTargets()
    if (!targets.length) return
    siege.gold -= SIEGE_REPAIR_COST

    // most damaged structures get patched first
    targets.sort((a, b) => (a.hitpoints / a.maxHitpoints) - (b.hitpoints / b.maxHitpoints))
    let pool = SIEGE_REPAIR_HP
    for (const w of targets) {
        if (pool <= 0) break
        const amount = min(w.maxHitpoints - w.hitpoints, pool)
        w.hitpoints += amount
        pool -= amount
        spawnRing(w.pos.x, w.pos.y, w.team, w.size / 2)
        if (w._floaties) {
            w._floaties.push({ x: w.pos.x, y: w.pos.y, vy: -w.size * 0.01, alpha: 220, text: '+' + round(amount), col: [120, 230, 120] })
        }
    }
}

// ---------- COINS ----------
function dropGold(x, y, amount) {
    siege.coins.push({
        x, y,
        vx: random(-0.5, 0.5), vy: random(-0.5, -1.0),
        a: 255,
        amount,
    });
}

function updateCoins() {
    // const collectR = width / 40;
    for (let i = siege.coins.length - 1; i >= 0; i--) {
        const c = siege.coins[i];
        c.x += c.vx; c.y += c.vy;
        c.vx *= 0.98; c.vy = c.vy * 0.98 + 0.05;
        c.a -= 2; if (c.a < 20) c.a = 20;

        if (c.a <= 20) {
            siege.gold += c.amount;
            siege.coins.splice(i, 1);
            continue;
        }

        // magnet target = castleAnchor
        // const dx = castleAnchor.x - c.x, dy = castleAnchor.y - c.y;
        // const d2 = dx * dx + dy * dy;
        // if (d2 < (collectR * collectR)) {
        //     siege.gold += c.amount;
        //     siege.coins.splice(i, 1);
        //     continue;
        // }
    }
}

function drawCoins() {
    noStroke();
    for (const c of siege.coins) {
        push();
        drawingContext.shadowColor = 'rgba(255,220,60,0.6)';
        drawingContext.shadowBlur = 12;
        fill(255, 220, 60, c.a);
        ellipse(c.x, c.y, width / 120);
        pop();
    }
}



// ---------- WAVE SCALING ----------
function applyWaveScaling(u, wave) {
    // gentle stat creep on top of the exponential budget, so old comps age out
    const hpMul = 1 + wave * 0.04;
    const spdMul = 1 + min(0.35, wave * 0.015);

    u.maxHitpoints = floor(u.maxHitpoints * hpMul);
    u.hitpoints = u.maxHitpoints;
    if (u.speed) {
        u.speed *= spdMul;
        u.maxSpeed *= spdMul;
    }
    if (u.attackPower) u.attackPower *= 1 + wave * 0.02;
    if (u.attackSpeed > 8) u.attackSpeed = max(8, floor(u.attackSpeed * pow(0.99, wave)));
}

function spawnBlue(kind, x, y, wave) {
    let u = makeTroop(kind, x, y, 'blue');
    if (!u) return null;
    applyWaveScaling(u, wave);
    blueTroops.push(u);
    return u;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rint(a, b) { return Math.floor(random(a, b + 1)); }

function siegeUnlockWave(name) {
    return max(1, round(BALANCE[name].cost / 10)) // pricier troops join the assault later
}

// Budget-based assault built from the same cost system as everything else.
// Pressure grows exponentially AND leans on your standing army, so hoarding
// a big host just draws a bigger assault — you should feel threatened every wave.
function spawnWave(wave) {
    let armyValue = 0
    redTroops.forEach(t => { if (t.name != 'castlewall') armyValue += t.cost || 0 })

    const isSurge = wave > 0 && wave % 5 === 0
    // flat +40 bites hard early (walls + keep garrison made scouts trivial)
    // and washes out by the midgame, where the exponential rules
    let budget = floor(55 * pow(1.16, wave) + 40 + armyValue * 0.15)
    if (isSurge) budget = floor(budget * 1.4)

    // the assault LEADS WITH A LINE OF BATTLE: a solid double rank of
    // soldiers spanning the approach — a wall of men, then the variety
    const lineCount = min(24, floor(budget * 0.4 / BALANCE.soldier.cost))
    if (lineCount >= 3) {
        const spacing = min(height * 0.8 / lineCount, height / 12)
        for (let i = 0; i < lineCount; i++) {
            const y = constrain(height / 2 + (i - (lineCount - 1) / 2) * spacing + random(-4, 4), 10, height - 10)
            spawnBlue('soldier', width + 30 + (i % 2) * 18 + random(-6, 6), y, wave)
        }
        budget -= lineCount * BALANCE.soldier.cost
    }

    const pool = []
    for (const name in BALANCE) {
        const b = BALANCE[name]
        if (b.sold === false || siegeUnlockWave(name) > wave + 1) continue
        const ranged = b.rangeMult >= 1.5 || b.atk == 0
        pool.push({
            name,
            // melee leads the assault — twice the draw weight of the backline
            weight: max(1, round(24 / b.cost)) * (ranged ? 1 : 2),
            ranged,
            pack: b.shopPack || 1,
            cost: b.cost * (b.shopPack || 1),
        })
    }

    const lanes = 5
    const laneH = height / lanes
    let necroCount = 0
    let squad = 0
    let guard = 400
    while (guard-- > 0 && budget >= 10) {
        const affordable = pool.filter(e => e.cost <= budget && !(e.name == 'necromancer' && necroCount >= 1))
        if (!affordable.length) break
        const pick = weightedPick(affordable)
        if (pick.name == 'necromancer') necroCount++

        // squads STREAM in over ~10s+ — a rolling assault with reinforcement
        // rhythm, not one blob collision
        const lane = squad % lanes
        const baseY = laneH * (lane + 0.5) + random(-laneH * 0.25, laneH * 0.25)
        const baseX = width + 20 + floor(squad / lanes) * 200
        for (let i = 0; i < pick.pack; i++) {
            const x = baseX + (pick.ranged ? 70 : 0) + random(-10, 10)
            const y = constrain(baseY + random(-laneH * 0.3, laneH * 0.3), 10, height - 10)
            spawnBlue(pick.name, x, y, wave)
        }
        budget -= pick.cost
        squad++
    }

    siege.aliveEnemies = blueTroops.length;
}


function initSiege() {
    battling = true;
    siege.wave = 0;
    siege.nextWaveFrame = battleFrameCount + 60 * 5; // 5s to muster before the first assault
    siege.gold = 200;
    siege.coins.length = 0;
    siege.running = true;
    siege.gameOver = false;
    siege.clearedPaid = false;
    siege.bonusShownUntil = 0;
    siege.interestThisWave = 0;
    siege.repairButton = new Button(width - width / 12, height - height / 11, width / 9, height / 12, 'siege_repair');
    siege.barracks = [];
    siege.barracksBuildButton = new Button(width - width / 12, height - height / 11 - height / 12 - height / 80, width / 9, height / 12, 'siege_barracks_build');
    siege.barracksUpgradeButton = new Button(width - width / 12, height - height / 11 - 2 * (height / 12 + height / 80), width / 9, height / 12, 'siege_barracks_upgrade');

    // clear field except permanent walls list
    redTroops.length = 0;
    blueTroops.length = 0;
    redProjectiles.length = 0;
    blueProjectiles.length = 0;
    redForces.length = 0;
    blueForces.length = 0;
    redToRemove.length = 0;
    blueToRemove.length = 0;

    spawnCastleRow();
}

function spawnCastleRow() {
    castleWalls.length = 0;

    // Column position for the wall row (left side defending)
    const x = width * 0.15;
    castleAnchor.x = x;
    castleAnchor.y = height * 0.5;

    // Segment geometry — every segment fully on-screen, covering top to bottom
    const segSize = height / 10
    const spacing = segSize;
    const n = ceil(height / spacing);

    for (let i = 0; i < n; i++) {
        const y = (i + 0.5) * spacing; // segment centers from h/20 down to h - h/20
        const w = new CastleWall(x, y, 'red');

        redTroops.push(w);
        castleWalls.push(w);
    }

    // the keep — what the walls exist to protect
    siegeKeep = new Keep(width * 0.06, height * 0.5, 'red');
    redTroops.push(siegeKeep);
}



function updateSiege() {
    if (!siege.running || siege.gameOver) return;

    const cleared = blueTroops.length === 0 && siege.wave > 0;

    if (cleared) {
        // assault repelled: pay a bonus and pull the next wave in — no long dead air
        if (!siege.clearedPaid && siege.nextWaveFrame > battleFrameCount + 300) {
            siege.clearedPaid = true;
            siege.lastBonus = 25 + siege.wave * 6;
            siege.gold += siege.lastBonus;
            siege.bonusShownUntil = battleFrameCount + 150;
            siege.nextWaveFrame = battleFrameCount + 60 * 6;

            // veterancy: survivors of the assault harden (3 ranks max) and patch up.
            // this is what makes it YOUR army — losing a 3-pip veteran should hurt.
            redTroops.forEach(t => {
                if (!t.maxSpeed || t.name == 'zombie' || t.isDead) return;
                if ((t.vet || 0) >= 3) return;
                t.vet = (t.vet || 0) + 1;
                t.maxHitpoints = floor(t.maxHitpoints * 1.10);
                t.hitpoints = min(t.maxHitpoints, t.hitpoints + t.maxHitpoints * 0.15);
                t.attackPower *= 1.08;
                t.dmgMult = (t.dmgMult || 1) * 1.08;
            });
        }
    }

    // war chest interest trickles in passively: +1 per 40 held, up to +6, every
    // 5s — but the total per wave is capped, so stalling a straggler or turtling
    // behind the walls can't print unbounded gold
    if (battleFrameCount % 300 == 0) {
        siege.lastInterest = max(0, min(floor(siege.gold / 40), 6, SIEGE_INTEREST_WAVE_CAP - siege.interestThisWave));
        siege.interestThisWave += siege.lastInterest;
        siege.gold += siege.lastInterest;
    }

    // Pulse waves
    if (battleFrameCount >= siege.nextWaveFrame) {
        siege.clearedPaid = false;
        siege.interestThisWave = 0;
        spawnWave(siege.wave);
        siege.wave++;
        siege.nextWaveFrame = battleFrameCount + siege.interval;
    }

    // Lose condition: the keep falls (breached walls are a crisis, not the end)
    if ((!siegeKeep || siegeKeep.isDead || siegeKeep.hitpoints <= 0) && !siege.gameOver) {
        siege.gameOver = true;
        siege.bestWave = max(siege.bestWave, siege.wave);
        saveProgress();
        battling = false;
    }
}

// HUD
function drawSiegeHUD() {
    // wave & gold
    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(width / 40);
    text(`Wave ${siege.wave}` + (siege.bestWave ? `  (best ${siege.bestWave})` : ''), width / 2, height / 60);

    textSize(width / 60);
    const projInterest = max(0, min(floor(siege.gold / 40), 6, SIEGE_INTEREST_WAVE_CAP - siege.interestThisWave));
    const interestNote = projInterest ? `  (+${projInterest} interest/5s)` : (siege.interestThisWave >= SIEGE_INTEREST_WAVE_CAP ? '  (interest maxed)' : '');
    text(`Gold: ${siege.gold}` + interestNote, width / 2, height / 60 + width / 40);

    // next-assault countdown + surge warning
    if (!siege.gameOver) {
        const secs = max(0, ceil((siege.nextWaveFrame - battleFrameCount) / 60));
        const surgeNext = siege.wave > 0 && siege.wave % 5 === 0;
        if (surgeNext) {
            fill(255, 130, 130, 180 + 60 * sin(frameCount / 8));
            textSize(width / 55);
            text(`HEAVY ASSAULT in ${secs}s`, width / 2, height / 60 + width / 24);
        } else if (blueTroops.length === 0) {
            fill(255, 170);
            textSize(width / 65);
            text(`next assault in ${secs}s`, width / 2, height / 60 + width / 24);
        }
        siege.repairButton.show();
        siege.barracksBuildButton.show();
        siege.barracksUpgradeButton.show();
    }

    // early-clear bonus toast
    if (battleFrameCount < siege.bonusShownUntil) {
        fill(120, 230, 120, 220);
        textSize(width / 50);
        text(`assault repelled! +${siege.lastBonus} gold`, width / 2, height / 5);
    }

    // castle HP bar
    // castle HP: sum across segments
    let totalHp = 0, totalMax = 0;
    for (let i = 0; i < castleWalls.length; i++) {
        const w = castleWalls[i];
        if (!w || w.isDead) continue;
        totalHp += (w.hitpoints || 0);
        totalMax += (w.maxHitpoints || 1);
    }
    const pct = totalMax > 0 ? constrain(totalHp / totalMax, 0, 1) : 0;

    // bars: walls (outer defense) and the keep (the objective)
    rectMode(CORNER)
    const W = width * 0.5, H = max(6, width * 0.012);
    const xBar = (width - W) / 2, yBar = height - (H * 2.5);
    noStroke(); fill(30, 160); rect(xBar, yBar, W, H, H / 2);
    fill(lerpColor(color(255, 60, 60), color(80, 220, 120), pct));
    rect(xBar, yBar, W * pct, H, H / 2);

    const keepPct = siegeKeep ? constrain(siegeKeep.hitpoints / siegeKeep.maxHitpoints, 0, 1) : 0;
    const kW = W * 0.6, kX = (width - kW) / 2, kY = yBar - H * 1.6;
    fill(30, 160); rect(kX, kY, kW, H * 0.8, H / 2);
    fill(lerpColor(color(255, 60, 60), color(80, 220, 120), keepPct));
    rect(kX, kY, kW * keepPct, H * 0.8, H / 2);

    fill(255, 130); textAlign(RIGHT, CENTER); textSize(H * 1.1);
    text('keep', kX - H, kY + H * 0.4);
    text('walls', xBar - H, yBar + H * 0.5);


    // GAME OVER
    if (siege.gameOver) {
        drawBanner('The Keep Falls!', `waves survived: ${siege.wave} — best ${siege.bestWave} — click for title`)
        if (mouseIsPressed) {
            changeScreen('title')
        }
    }
}

// --- RETREAT HELPERS ---
function orderRetreatToCastle(u) {
    if (!u || !u.pos) return;
    u.retreating = true;

    // --- muster in ranks so the lull reads as an army forming up: ---
    // braced units hold the forward line, melee behind them, ranged and support by the wall
    const wallX = castleAnchor.x;
    const offset = (u.size || width / 60); // buffer so units don't overlap wall
    let bandX
    if (isBraced(u)) {
        bandX = wallX + width * 0.16
    } else if (BALANCE[u.name] && (BALANCE[u.name].rangeMult >= 1.5 || BALANCE[u.name].atk == 0)) {
        bandX = wallX + width * 0.045
    } else {
        bandX = wallX + width * 0.10
    }
    bandX += offset * 1.5

    // --- vertical distribution (lanes + jitter) ---
    const lanes = 10;
    const laneH = height / lanes;

    if (u._retreatId == null) {
        orderRetreatToCastle._uid = (orderRetreatToCastle._uid || 0) + 1;
        u._retreatId = orderRetreatToCastle._uid;
    }
    const laneIdx = u._retreatId % lanes;
    const laneCenterY = laneH * (laneIdx + 0.5);

    // deterministic jitter per unit
    let x = (u._retreatId | 0);
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    const jitter = ((x >>> 0) / 4294967296) - 0.5;

    const slotX = bandX;
    const slotY = constrain(laneCenterY + jitter * laneH * 0.4, laneH * 0.15, height - laneH * 0.15);

    // --- steering toward slot with "arrive" slowdown ---
    const dx = slotX - u.pos.x;
    const dy = slotY - u.pos.y;
    const d = Math.hypot(dx, dy) || 1;

    const spd = (u.maxSpeed || u.speed || 1.2);
    const arriveR = Math.max(width, height) / 18;
    const factor = d < arriveR ? (d / arriveR) : 1;

    const vx = (dx / d) * spd * factor;
    const vy = (dy / d) * spd * factor;

    const mix = 0.5;
    u.vel.x = (u.vel.x ?? 0) * (1 - mix) + vx * mix;
    u.vel.y = (u.vel.y ?? 0) * (1 - mix) + vy * mix;

    moveUnit(u);

    // --- stop if basically at the line ---
    if (d < arriveR * 0.5 || u.pos.x <= wallX - offset) {
        u.vel.x *= 0.8;
        u.vel.y *= 0.8;
        if (Math.hypot(u.vel.x, u.vel.y) < 0.05) {
            u.vel.x = 0;
            u.vel.y = 0;
        }
    }
}

// veterancy pips: wave survivors wear their ranks above their heads
function drawVetPips(u) {
    noStroke()
    fill(255, 220, 120, 230)
    for (let i = 0; i < u.vet; i++) {
        ellipse(u.pos.x + (i - (u.vet - 1) / 2) * u.size / 2.5, u.pos.y - u.size, u.size / 5)
    }
}

/** Clear retreat state when re-engaging */
function cancelRetreat(u) {
    if (u.retreating) u.retreating = false;
}

/** Core behavior: if unit has no targets and no enemies near, walk to castle */
function fallbackRetreatBehaviorForUnit(u, enemies) {
    if (!u || u.isDead || u.name === 'castlewall' || u.name === 'keep' || u.name === 'barracks') return;

    // If enemies around or we already have a valid target, cancel retreat.
    if (u.target && u.target !== u && !u.target.isDead) {
        cancelRetreat(u);
        return;
    }

    // retreat line just before the castle wall
    const wallX = castleAnchor.x;
    const offset = (u.size || width / 60); // buffer so they don’t overlap the wall
    const retreatX = wallX - offset * 1.5;

    // if we are to the right of the retreat line, keep moving left
    if (u.pos.x > retreatX) {
        orderRetreatToCastle(u);
    } else {
        // already at or past retreat line → slow/stop
        u.vel.x *= 0.85;
        u.vel.y *= 0.85;
        if (Math.hypot(u.vel.x, u.vel.y) < 0.05) {
            u.vel.x = 0;
            u.vel.y = 0;
        }
        u.retreating = true; // remain in retreat state until threats appear
    }
}


/** Batch behavior for a whole team list */
function fallbackRetreatBehavior(teamList, enemyList) {
    for (let i = 0; i < teamList.length; i++) {
        const u = teamList[i];
        fallbackRetreatBehaviorForUnit(u, enemyList);
    }
}
