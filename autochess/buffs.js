// Autochess buff registry — fully data-driven, no per-buff logic in troop files.
//
// Three kinds of buff:
//   apply(unit, stacks)  — mutates a freshly-reset red troop (stats or wrapped methods)
//   instant(engine)      — fires once at purchase (e.g. +1 life)
//   economy              — no code here; the engine reads buffStacks() (merchant, treasury, bounty)
//
// applyUnitBuffs() runs after EVERY reset() (purchase, battle start, round load), so
// effects never stack across rounds: methods are restored to their originals first.
// Registry order matters: stat buffs first, method wrappers last, so wrappers
// capture already-buffed stats.
//
// Prices escalate as you stack: price = base + 3 × stacks owned.

const AUTOCHESS_BUFFS = {
    vitality: {
        name: 'Iron Rations', icon: 'HP+', price: 6, weight: 3, maxStacks: 3,
        desc: 'All your troops gain +20% max health per stack',
        apply: (u, s) => {
            const m = 1 + 0.2 * s
            u.maxHitpoints *= m
            u.hitpoints *= m
        },
    },
    sharpen: {
        name: 'Sharpened Steel', icon: 'ATK', price: 6, weight: 3, maxStacks: 3,
        desc: 'All your troops deal +20% damage per stack',
        apply: (u, s) => {
            const m = 1 + 0.2 * s
            u.attackPower *= m
            u.dmgMult = (u.dmgMult || 1) * m // projectiles read this
        },
    },
    drill: {
        name: 'War Drums', icon: 'SPD', price: 7, weight: 2, maxStacks: 3,
        desc: 'All your troops attack 15% faster per stack',
        apply: (u, s) => {
            u.attackSpeed = max(4, round(u.attackSpeed / (1 + 0.15 * s)))
        },
    },
    forced_march: {
        name: 'Forced March', icon: 'RUN', price: 4, weight: 2, maxStacks: 2,
        desc: 'All your troops move 20% faster per stack',
        apply: (u, s) => {
            const m = 1 + 0.2 * s
            u.speed *= m
            u.maxSpeed *= m
        },
    },
    giants: {
        name: 'Giant Soldiers', icon: 'BIG', price: 9, weight: 1, maxStacks: 1,
        desc: 'Your soldiers are huge: double health, +50% damage',
        apply: (u) => {
            if (u.name != 'soldier') return
            u.maxHitpoints *= 2
            u.hitpoints *= 2
            u.attackPower *= 1.5
            u.size *= 1.5
            u.attackRange *= 1.5
        },
    },
    overcharge: {
        name: 'Overcharge', icon: 'ZAP', price: 8, weight: 1, maxStacks: 1,
        desc: 'Your wizards cast 40% faster',
        apply: (u) => {
            if (u.name != 'ewizard' && u.name != 'fwizard') return
            u.attackSpeed = max(10, round(u.attackSpeed * 0.6))
        },
    },
    // ---- economy (engine reads these) ----
    merchant: {
        name: 'Merchant Guild', icon: '$-1', price: 8, weight: 1, maxStacks: 1,
        desc: 'Troops in the shop cost 1 less gold',
    },
    treasury: {
        name: 'Royal Treasury', icon: '$$$', price: 10, weight: 1, maxStacks: 1,
        desc: '+3 income per round, and interest cap raised to 10',
    },
    bounty: {
        name: 'Bounty Hunters', icon: 'GOLD', price: 6, weight: 2, maxStacks: 2,
        desc: '+1 gold per 4 enemies slain each battle, per stack',
    },
    // ---- instant ----
    second_wind: {
        name: 'Second Wind', icon: '+1UP', price: 12, weight: 1, maxStacks: 2,
        desc: 'Gain an extra life, right now',
        instant: (engine) => { engine.lives++ },
    },
    // ---- method wrappers (keep these last so they capture buffed stats) ----
    triple_shot: {
        name: 'Triple Shot', icon: 'x3', price: 8, weight: 2, maxStacks: 1,
        desc: 'Your archers loose three arrows per volley',
        apply: (u) => {
            if (u.name != 'archer') return
            const base = u.attack.bind(u)
            u.attack = function () { base(); base(); base() }
        },
    },
    bloodthirst: {
        name: 'Bloodthirst', icon: 'VAMP', price: 8, weight: 2, maxStacks: 1,
        desc: 'Your melee troops heal for half the damage they deal',
        apply: (u) => {
            if (!u.attackPower || u.attackRange > u.size * 5) return
            const base = u.attack.bind(u)
            u.attack = function () { base(); heal(u, u.attackPower * 0.5) }
        },
    },
    final_rot: {
        name: 'Final Rot', icon: 'BOOM', price: 7, weight: 2, maxStacks: 1,
        desc: 'Your zombies burst on death, searing nearby enemies',
        apply: (u) => {
            if (u.name != 'zombie') return
            u._deathEffect = function (t) {
                const foes = checkTeamCollision(t.pos, width / 45, t.team == 'red' ? 'blue' : 'red')
                for (let i = 0; i < foes.length; i++) {
                    takeDamage(foes[i], 12)
                }
                spawnRing(t.pos.x, t.pos.y, 'fire', t.size * 3)
            }
        },
    },
    last_stand: {
        name: 'Last Stand', icon: 'RAGE', price: 9, weight: 1, maxStacks: 1,
        desc: 'Troops below 40% health attack twice as fast',
        apply: (u) => {
            const baseAS = u.attackSpeed
            const baseUpdate = u.update.bind(u)
            u.update = function (allies, foes) {
                u.attackSpeed = (u.hitpoints < u.maxHitpoints * 0.4) ? max(3, floor(baseAS / 2)) : baseAS
                return baseUpdate(allies, foes)
            }
        },
    },
}

// Re-applies the owned buff set to a freshly-reset unit. Idempotent: originals are
// restored first, so calling it after every reset never double-stacks anything.
function applyUnitBuffs(unit) {
    if (mode != 'autochess' || !autochessEngine || unit.team != 'red') return

    if (!unit._baseAttack && unit.attack) unit._baseAttack = unit.attack
    if (unit._baseAttack) unit.attack = unit._baseAttack
    if (!unit._baseUpdate && unit.update) unit._baseUpdate = unit.update
    if (unit._baseUpdate) unit.update = unit._baseUpdate
    unit._deathEffect = undefined
    unit.dmgMult = 1

    const owned = autochessEngine.buffs
    for (const id in AUTOCHESS_BUFFS) { // registry order, not purchase order
        if (owned[id] && AUTOCHESS_BUFFS[id].apply) {
            AUTOCHESS_BUFFS[id].apply(unit, owned[id])
        }
    }
}
