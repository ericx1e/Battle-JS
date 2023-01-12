function takeDamage(unit, damage) {
    unit.hitpoints -= damage
    unit.hitpoints = Math.max(unit.hitpoints, 0)
}

function heal(unit, heal) {
    unit.hitpoints += heal
    unit.hitpoints = Math.min(unit.hitpoints, unit.maxHitpoints)
}