// true when the hit comes from the direction the unit is facing (toward its target)
function isFrontal(unit, fromPos) {
    if (!unit.target || unit.target === unit || !fromPos) return false
    const facing = atan2(unit.target.pos.y - unit.pos.y, unit.target.pos.x - unit.pos.x)
    const toHit = atan2(fromPos.y - unit.pos.y, fromPos.x - unit.pos.x)
    let d = abs(toHit - facing) % TWO_PI
    if (d > PI) d = TWO_PI - d
    return d < PI * 0.4 // ~±72° shield arc
}

// shoulder to shoulder: a drilled melee troop flanked by 2+ melee comrades
// fights as a RANK and gains +1 armor. massed lines are worth more than the
// sum of their dots; zombies are rabble and don't hold ranks.
function isRankMelee(u) {
    return u.attackPower > 0 && u.maxSpeed && u.attackRange < u.size * 5 && u.name != 'zombie'
}

function rankBonus(unit) {
    if (!isRankMelee(unit)) return 0
    const near = checkTeamCollision(unit.pos, unit.size * 1.8, unit.team)
    let n = 0
    for (let i = 0; i < near.length; i++) {
        const a = near[i]
        if (a !== unit && !a.isDead && isRankMelee(a)) n++
    }
    return n >= 2 ? 1 : 0
}

// melee follow-through: when a strike KILLS with damage to spare, the leftover
// carries into the next enemy in reach — real soldiers cleave THROUGH chaff
// instead of wasting full swings on half-rotted zombies.
let _carryDepth = 0
function carryThrough(attacker, slain, damage) {
    if (_carryDepth >= 3) return
    const foes = checkTeamCollision(attacker.pos, attacker.attackRange * 1.5, slain.team)
    let best = null, bestD2 = Infinity
    for (let i = 0; i < foes.length; i++) {
        const f = foes[i]
        if (f === slain || f.isDead || f.hitpoints <= 0) continue
        const d2 = distSquared(attacker.pos, f.pos)
        if (d2 < bestD2) { bestD2 = d2; best = f }
    }
    if (!best) return
    _carryDepth++
    takeDamage(best, damage, attacker)
    _carryDepth--
}

// attacker is passed by melee attacks only — projectiles resolve blocking
// themselves. noCarry disables follow-through (AoE melee like the reaper sweep
// already hits everyone — carrying would double-dip).
function takeDamage(unit, damage, attacker, noCarry) {
    if (attacker && unit.blockMelee && isFrontal(unit, attacker.pos)) {
        damage *= (1 - unit.blockMelee) // caught on the shield
        unit.blockedFrames = 8
    }
    const armor = (unit.armor || 0) + rankBonus(unit)
    if (armor) {
        damage = Math.max(1, damage - armor) // armor shaves a flat amount off every hit
    }
    const leftover = damage - unit.hitpoints
    unit.hitpoints -= damage
    unit.hitpoints = Math.max(unit.hitpoints, 0)
    unit.takingDamageFrames = Math.min((unit.takingDamageFrames || 0) + 4, 20)
    if (attacker && !noCarry && unit.hitpoints <= 0 && leftover > 0) {
        carryThrough(attacker, unit, leftover)
    }
}

// sudden-death decay: percent-max-hp drain that ignores armor and blocks
function applyFatigue(troops, ramp) {
    for (let i = 0; i < troops.length; i++) {
        const t = troops[i]
        if (!t || t.isDead) continue
        t.hitpoints -= t.maxHitpoints * 0.005 * ramp
        t.takingDamageFrames = Math.min((t.takingDamageFrames || 0) + 2, 20)
    }
}

function heal(unit, heal) {
    unit.hitpoints += heal
    unit.hitpoints = Math.min(unit.hitpoints, unit.maxHitpoints)
}