// balance.js — single source of truth for troop stats, identity, and costs.
//
// THE COST FORMULA
// ----------------
// A troop's combat value follows Lanchester's square law: value ≈ sqrt(EHP × DPS).
// Two 10-value troops beat one 20-value troop — numbers win. That is the swarm
// fantasy, and it is intentional: swarms are the baseline-efficient way to spend
// gold. Elite troops earn their price with multipliers raw stats don't show —
// range, AoE, crowd control — which are exactly the tools that counter swarms.
//
//   value = K × sqrt(EHP × DPS) × rangeMult × aoeMult
//   cost  = round5((value + abilityValue) × tweak)
//
//   EHP          hp inflated by armor (armor removes a flat amount from every hit,
//                measured against a typical 10-damage attack)
//   DPS          attackPower / attackPeriod × 60 frames
//   K            calibration constant so a soldier costs exactly 10
//   abilityValue flat gold worth of things the stats can't see (spear volley,
//                knockback, healing, spawning zombies). For pure-support troops
//                this IS the cost.
//   tweak        hand-tuning knob. After a playtest, nudge this — don't rewrite stats.
//
// Change any stat below and the troop's price updates everywhere: campaign
// budgets, siege gold, and the autochess shop (shopCost = cost / 5).
//
// BEFORE DESIGNING A NEW UNIT'S MECHANIC, DECIDE WHICH KIND OF RICH IT IS
// -------------------------------------------------------------------------
// Richness isn't the risk — a ONE-SHOT resolved effect (an AoE swing that
// checks an arc once, a knockback, a stat modifier) is cheap to get right on
// the first pass, at any price tier: knight's armor+immovable+multi-target
// cleave is a real kit priced as an ordinary elite and it just works.
//
// A PERSISTENT STATEFUL mechanic — an aura, a tether, a leap-then-recover,
// anything that has to hold correct behavior across hundreds of frames while
// colliding/moving/dying units keep changing the world under it — is a
// different animal. It is expensive to build (every bug this project hit in
// 2026 lived here: a leap-diver stuck backpedaling forever because a retreat
// check fired before its first landing, a chain-bind clump popping apart
// because a hold-position wasn't re-enforced every frame, the same
// duplicate-grab bug from checkTeamCollision's missing dedupe hitting twice
// in one session) and it stays expensive to TUNE (both units needed multiple
// full sim rounds just to find a price that didn't break in some direction).
// Reserve stateful mechanics for RARE, EXPENSIVE capstones — the price
// buffers a rough first pass, and you're never fielding five of them for the
// bugs to compound across. Do not try to make a stateful-mechanic unit
// swarm- or mid-tier-affordable; that middle ground is where the pain is.

const BALANCE = {
    // HP is globally ~1.5× damage-adjusted so lines GRIND instead of evaporating;
    // K below re-anchors on the soldier, so prices are unaffected by uniform hp scaling.
    //            hp   atk  period armor range aoe  ability tweak  identity
    soldier: { hp: 210, atk: 10, period: 40, armor: 0, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 0, tweak: 1.0 },   // the benchmark: cheap, honest melee
    zombie: { hp: 45, atk: 6, period: 40, armor: 0, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 0, tweak: 1.0, decay: 0.03, shopPack: 6 }, // disposable CHAFF — bodies and blocking, not soldier-grade damage; rots away over ~25s
    archer: { hp: 75, atk: 25, period: 80, armor: 0, rangeMult: 2.0, aoeMult: 1.0, abilityValue: 0, tweak: 1.35 },  // glass cannon at range; tweak prices massed focus-fire
    spear: { hp: 180, atk: 8, period: 30, armor: 0, rangeMult: 1.1, aoeMult: 1.0, abilityValue: 8, tweak: 0.85, sold: false },   // RETIRED from shops (phalanx owns the pierce role) — code kept for levels/mods
    knight: { hp: 420, atk: 45, period: 110, armor: 5, rangeMult: 1.1, aoeMult: 1.25, abilityValue: 5, tweak: 1.2 }, // THE tank: plate shrugs chip from EVERY direction, can't be shoved; the greatsword CLEAVES its frontal arc. tweak: armor×cleave synergy beats what the formula sees
    phalanx: { hp: 345, atk: 9, period: 45, armor: 1, rangeMult: 1.15, aoeMult: 1.3, abilityValue: 7, tweak: 1.0 }, // melee brace: halves frontal melee damage, can't be shoved; sarissa thrust pierces up to 3 in its lane
    shield: { hp: 400, atk: 3, period: 45, armor: 2, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 10, tweak: 1.0 },  // ARROW WALL first: frontal arrows/spears bounce; bash sweeps+shoves the press; knight out-tanks it in melee
    charger: { hp: 240, atk: 20, period: 45, armor: 0, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 20, tweak: 1.0, impactMult: 5 }, // shock cavalry: lance impact = atk×5; a KILLING impact keeps the charge rolling into the next victim
    reaver: { hp: 190, atk: 16, period: 38, armor: 0, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 22, tweak: 1.0, impactMult: 5, cooldownFrames: 200 }, // DISRUPTOR: leaps clean over the front line onto a priority (ranged/support) target — the crash itself is lethal to something squishy, like a charger's impact — then brawls from deep in enemy lines, fragile once surrounded
    ewizard: { hp: 75, atk: 120, period: 180, armor: 0, rangeMult: 2.0, aoeMult: 2.2, abilityValue: 0, tweak: 1.0 }, // chain lightning: shreds + stuns swarms
    fwizard: { hp: 75, atk: 25, period: 150, armor: 0, rangeMult: 2.0, aoeMult: 2.5, abilityValue: 0, tweak: 1.0, burnDamage: 15 }, // fireballs: burns packed swarms
    warlock: { hp: 220, atk: 24, period: 75, armor: 0, rangeMult: 1.15, aoeMult: 1.6, abilityValue: 20, tweak: 1.0, chainCount: 3, castWindup: 14, castTravel: 8, rootFrames: 35, healFraction: 0.4, empoweredEvery: 4, empoweredRangeMult: 1.6, empoweredDamageMult: 1.8 }, // BATTLE MAGE v2, a real spellcaster (Eric: "never feels exciting, no mage identity" — v1 was a continuous background aura + a separate hidden detonation counter, a stat-stick with a reskin). Now a proper cast rhythm reusing the windup/release/impact language every other troop already uses: attack() begins a cast, chains lash out and travel over castWindup+castTravel frames, damage lands at impact (not at cast-start, same deferred-damage rule as soldier/knight), each hit target gets yanked to just outside melee range and rooted for rootFrames (short — a full-length root was the exact bug that made v1 unhittable), mage heals a lump off what it dealt. Every empoweredEvery-th cast is supercharged (wider range, bigger hit). No more continuous per-frame tick, no separate detonation meter — the "big moment" is just the SAME cast, periodically amplified.

    reaper: { hp: 300, atk: 35, period: 45, armor: 2, rangeMult: 1.0, aoeMult: 2.2, abilityValue: 15, tweak: 1.0 }, // AoE bruiser, heals on kills
    summoner: { hp: 150, atk: 0, period: 95, armor: 0, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 25, tweak: 1.0, spawnCount: 2, packCap: 6 }, // feeds a zombie pack (max 6 alive) — a bounded asset, not an income stream
    necromancer: { hp: 150, atk: 0, period: 1, armor: 0, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 55, tweak: 1.0, sold: false }, // your dead rise as zombies. DISABLED (July 2026, Eric: "hard to get right, weird as 1-per-team, either weak or very strong") — code kept as-is for later; see memory for gravedigger rework + replacement ideas
    castlewall: { hp: 2000, atk: 0, period: 1, armor: 0, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 100, tweak: 1.0, sold: false }, // siege anchor with archer garrison; not in shops
    keep: { hp: 2500, atk: 0, period: 1, armor: 0, rangeMult: 1.0, aoeMult: 1.0, abilityValue: 150, tweak: 1.0, sold: false, spawnPeriod: 480, spawnCap: 4 }, // the siege objective; lose it, lose the run. musters a soldier every 8s (max 4 of its own alive)
}

// soldier anchors at 10 gold — uniform hp scaling cancels out of all prices
const BALANCE_K = 10 / Math.sqrt(BALANCE.soldier.hp * (BALANCE.soldier.atk / BALANCE.soldier.period) * 60)

function troopValue(b) {
    let value = 0
    if (b.atk > 0) {
        const ehp = b.hp * 10 / Math.max(1, 10 - b.armor)
        const dps = b.atk / b.period * 60
        value = BALANCE_K * Math.sqrt(ehp * dps) * b.rangeMult * b.aoeMult
    }
    return (value + b.abilityValue) * b.tweak
}

function round5(v) {
    return Math.max(5, Math.round(v / 5) * 5)
}

// compute costs once at load
for (const name in BALANCE) {
    const b = BALANCE[name]
    b.cost = round5(troopValue(b))
    b.shopCost = Math.max(1, Math.round(b.cost / 5))
}

function troopCost(name) {
    return BALANCE[name] ? BALANCE[name].cost : 0
}

// dump the current price list to the console (handy while tuning)
function debugPrintCosts() {
    for (const name in BALANCE) {
        console.log(name, '$' + BALANCE[name].cost, '(shop ' + BALANCE[name].shopCost + ')')
    }
}
