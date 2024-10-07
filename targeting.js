function updateTarget(unit, foes) { // TODO: integrate spacial grid ?
    if (unit.target == unit || unit.target.isDead) {
        unit.target = foes[0]
        let targetDist = distSquared(unit.pos, unit.target.pos)
        foes.forEach(foe => {
            if (!foe.isDead) {
                let dist = distSquared(unit.pos, foe.pos)
                if (dist < targetDist) {
                    unit.target = foe
                    targetDist = dist
                }
            }
        })
    }
}