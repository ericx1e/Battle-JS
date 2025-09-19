
let castleWalls = [];                // array of Wall segments
let castleAnchor = { x: 0, y: 0 };   // for coin magnet + generic targeting


const siege = {
    wave: 0,
    nextWaveFrame: 0,
    interval: 60 * 18,   // ~18s between waves (tweak)
    aliveEnemies: 0,
    gold: 0,
    coins: [],           // coin drops
    running: false,
    difficultyMul: 1.0,  // grows each wave
    gameOver: false
};

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
    // Mild exponential growth
    const hpMul = 1 + wave * 0.12;
    const spdMul = 1 + min(0.25, wave * 0.02);

    if (u.maxHp) { u.maxHp = floor(u.maxHp * hpMul); u.hp = u.maxHp; }
    if (u.speed) u.speed *= spdMul;

    // Faster attacks if your units expose this field
    if (u.attackCooldown) u.attackCooldown = max(8, floor(u.attackCooldown * 0.94));
}

function spawnBlue(kind, x, y, wave) {
    let u = null;
    switch (kind) {
        case 'soldier': u = new Soldier(x, y, 'blue'); break;
        case 'archer': u = new Archer(x, y, 'blue'); break;
        case 'spear': u = new Spear(x, y, 'blue'); break;
        case 'shield': u = new Shield(x, y, 'blue'); break;
        case 'healer': u = new Healer(x, y, 'blue'); break;
        case 'ewizard': u = new EWizard(x, y, 'blue'); break;
        case 'summoner': u = new Summoner(x, y, 'blue'); break;
        case 'reaper': u = new Reaper(x, y, 'blue'); break;
        case 'necromancer': u = new Necromancer(x, y, 'blue'); break;
    }
    if (!u) return null;
    applyWaveScaling(u, wave);
    blueTroops.push(u);

    // initial goal = nearest castle segment so they actually siege
    // const seg = nearestAliveCastleSegment(u.pos);
    // if (seg) updateToClosestTarget(u, [seg]);
    return u;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rint(a, b) { return Math.floor(random(a, b + 1)); }
function spawnWave(wave) {
    const lanes = 5;
    const laneH = height / lanes;
    const edgeX = width + 20;

    // --- SURGE LOGIC: every 5th wave or 22% chance after wave 3
    const isSurge = (wave > 0 && (wave % 5 === 0 || (wave >= 3 && random() < 0.22)));
    const surgeMul = isSurge ? 1.35 : 1.0; // multiplicative bump for counts

    // how many squads (packets) to send this wave
    let squadsBase = 2 + Math.floor(wave / 2);
    if (isSurge) squadsBase += 1; // a little extra pressure on surges
    const squads = clamp(Math.floor(squadsBase), 2, 9);

    // one necromancer max per wave (from wave 6+)
    let necroSpawned = false;

    // heavier soldier volume later
    const soldierBonusLate = Math.max(0, wave - 8); // kicks in after wave 8

    // Slight horizontal staggering per squad so they arrive in waves
    const squadDelayX = 36; // pixels between squads (arrival offset)

    for (let s = 0; s < squads; s++) {
        const lane = (s % lanes);
        const baseY = laneH * (lane + 0.5) + random(-laneH * 0.2, laneH * 0.2);
        const baseX = edgeX + s * squadDelayX;

        // Enforce spawn bands so shields are always in front of supports:
        //   frontline:  baseX .. baseX+14
        //   midline:    baseX+16 .. baseX+30  (soldiers/spears)
        //   backline:   baseX+44 .. baseX+70  (archers/utility)
        const xFront = baseX;
        const xMid   = baseX + 20;
        const xBack  = baseX + 56;

        // ---------- FRONTLINE (soakers & pokers) ----------
        // Scale counts with surgeMul and wave; clamp to keep sane limits
        const nShields = clamp(
            Math.floor(((wave >= 2 ? rint(0, 1 + Math.floor(wave / 6)) : 0)) * surgeMul + 0.25),
            0, 3
        );
        const nSpears = clamp(
            Math.floor(((wave >= 3 ? rint(0, 1 + Math.floor(wave / 5)) : 0)) * surgeMul + 0.25),
            0, 3
        );
        const nSoldiers = clamp(
            Math.floor((2 + Math.floor(wave * 0.6) + rint(0, 1) + Math.floor(soldierBonusLate * 0.8)) * surgeMul),
            3, isSurge ? 22 : 18
        );

        // Shields always at the minimum X band
        for (let i = 0; i < nShields; i++) {
            const y = baseY + (i - (nShields - 1) / 2) * 12;
            spawnBlue('shield', xFront + random(-6, 6), y, wave);
        }
        // Spears right behind shields
        for (let i = 0; i < nSpears; i++) {
            const y = baseY + (i - (nSpears - 1) / 2) * 10;
            spawnBlue('spear', xFront + 12 + random(-4, 4), y, wave);
        }
        // Soldiers in the mid band
        for (let i = 0; i < nSoldiers; i++) {
            const y = baseY + (i - (nSoldiers - 1) / 2) * 7;
            spawnBlue('soldier', xMid + random(-6, 6), y, wave);
        }

        // ---------- BACKLINE (DPS / utility) ----------
        // Reduce healers: cap at 1 and make them less frequent
        const nArchers = clamp(
            rint((wave >= 2 ? 1 : 0), 1 + Math.floor(wave / 3)),
            0, isSurge ? 7 : 6
        );
        const nEwiz = clamp(
            (wave >= 4 ? rint(0, 1 + Math.floor(wave / 6)) : 0),
            0, 3
        );
        // Healers now rarer: only start at wave 6; geometric-ish 0/1 with bias to 0
        let nHealers = 0;
        if (wave >= 6) {
            // 30% chance to spawn a single healer on normal waves, 45% on surge
            const healChance = isSurge ? 0.45 : 0.30;
            nHealers = (random() < healChance) ? 1 : 0;
        }
        const nSummon = clamp(
            (wave >= 6 ? rint(0, 1 + Math.floor(wave / 8)) : 0),
            0, 2
        );

        // Backline always in the back band so they never overtake shields
        for (let i = 0; i < nArchers; i++) {
            const y = baseY + (i - (nArchers - 1) / 2) * 12;
            spawnBlue('archer', xBack + random(-8, 8), y, wave);
        }
        for (let i = 0; i < nEwiz; i++) {
            const y = baseY + (i - (nEwiz - 1) / 2) * 14;
            spawnBlue('ewizard', xBack + 6 + random(-6, 6), y, wave);
        }
        for (let i = 0; i < nHealers; i++) {
            const y = baseY + (i - (nHealers - 1) / 2) * 14;
            spawnBlue('healer', xBack + 12 + random(-6, 6), y, wave);
        }
        for (let i = 0; i < nSummon; i++) {
            const y = baseY + (i - (nSummon - 1) / 2) * 14;
            spawnBlue('summoner', xBack + 18 + random(-6, 6), y, wave);
        }

        // ---------- SPECIALS ----------
        // Reaper every few waves as a mini-boss (1 squad gets it)
        if (wave >= 7 && s === rint(0, squads - 1) && wave % 4 === 0) {
            spawnBlue('reaper', xMid + 8, baseY + rint(-10, 10), wave);
        }
    }

    // ---------- NECROMANCER (MAX 1/WAVE, waves 6+) ----------
    if (wave >= 6 && !necroSpawned) {
        const lane = rint(0, lanes - 1);
        const y = laneH * (lane + 0.5) + random(-laneH * 0.15, laneH * 0.15);
        const x = edgeX + squads * 10 + 84; // a bit further back to respect bands
        spawnBlue('necromancer', x, y, wave);
        necroSpawned = true;
    }

    siege.aliveEnemies = blueTroops.length;
}


function initSiege() {
    battling = true;
    siege.wave = 0;
    siege.nextWaveFrame = battleFrameCount + 60; // first wave after 1s
    siege.gold = 500;
    siege.coins.length = 0;
    siege.running = true;
    siege.gameOver = false;

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

    // Segment geometry
    const segSize = height / 10
    const spacing = segSize * 1;                 // slight overlap to avoid gaps
    const n = ceil(height / spacing) + 1;           // cover entire height

    for (let i = 0; i < n; i++) {
        const y = (i * spacing) - spacing * 0.5;      // start a bit above to cover top
        const w = new CastleWall(x, y, 'red');              // matches your placement constructor

        redTroops.push(w);
        castleWalls.push(w);
    }
}



function updateSiege() {
    if (!siege.running || siege.gameOver) return;

    // Pulse waves
    if (battleFrameCount >= siege.nextWaveFrame) {
        spawnWave(siege.wave);
        siege.wave++;
        siege.difficultyMul *= 1.07; // not used directly but available
        siege.nextWaveFrame = battleFrameCount + siege.interval;
    }

    // Lose condition
    // if castle
    // let anyAlive = false;
    // for (let i = 0; i < castleWalls.length; i++) {
    //     const w = castleWalls[i];
    //     if (w && !w.isDead && (w.hp || 0) > 0) { anyAlive = true; break; }
    // }
    // if (!anyAlive && !siege.gameOver) {
    //     siege.gameOver = true;
    //     battling = false;
    // }

}

// HUD
function drawSiegeHUD() {
    // wave & gold
    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(width / 40);
    text(`Wave ${siege.wave}`, width / 2, height / 60);

    textSize(width / 60);
    text(`Gold: ${siege.gold}`, width / 2, height / 60 + width / 40);

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

    // bar
    rectMode(CORNER)
    const W = width * 0.5, H = max(6, width * 0.012);
    const xBar = (width - W) / 2, yBar = height - (H * 2.5);
    noStroke(); fill(30, 160); rect(xBar, yBar, W, H, H / 2);
    fill(lerpColor(color(255, 60, 60), color(80, 220, 120), pct));
    rect(xBar, yBar, W * pct, H, H / 2);


    // GAME OVER
    if (siege.gameOver) {
        textAlign(CENTER, CENTER);
        textSize(width / 12);
        fill(255, 220);
        text('BREACHED!', width / 2, height / 2);
        textSize(width / 40);
        text(`Waves survived: ${siege.wave}`, width / 2, height / 2 + width / 12);
    }
}

// --- RETREAT HELPERS ---
function orderRetreatToCastle(u) {
    if (!u || !u.pos) return;
    u.retreating = true;

    // --- figure out the wall's X and place the retreat line just in front ---
    const wallX = castleAnchor.x; 
    const offset = (u.size || width / 60); // buffer so units don't overlap wall
    const bandX = wallX + width/10 + offset * 1.5;    // retreat line slightly left of wall

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
    const d  = Math.hypot(dx, dy) || 1;

    const spd = (u.maxSpeed || u.speed || 1.2);
    const arriveR = Math.max(width, height) / 18;
    const factor  = d < arriveR ? (d / arriveR) : 1;

    const vx = (dx / d) * spd * factor;
    const vy = (dy / d) * spd * factor;

    const mix = 0.18;
    u.vel.x = (u.vel.x ?? 0) * (1 - mix) + vx * mix;
    u.vel.y = (u.vel.y ?? 0) * (1 - mix) + vy * mix;

    if (typeof moveUnit === 'function') moveUnit(u);

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

/** Clear retreat state when re-engaging */
function cancelRetreat(u) {
    if (u.retreating) u.retreating = false;
}

/** Core behavior: if unit has no targets and no enemies near, walk to castle */
function fallbackRetreatBehaviorForUnit(u, enemies) {
    if (!u || u.isDead || u.name === 'castlewall') return;

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
