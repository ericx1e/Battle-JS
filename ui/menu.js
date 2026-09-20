function Menu() {
    this.w = width / 5
    this.h = height
    this.x = -this.w;
    this.y = 0

    let buttonsPerRow = 3

    let buttonSize = this.h / 16
    let troopGroups

    // grouped by role so the drawer reads as a roster, not a flat grid of 12
    // icons — frontline tanks, mobile strikers, ranged casters, support, and
    // the capstone gets its own row, set apart with a small gap and (in
    // button.js) a distinct highlighted border
    if (mode == 'autochess') {
        troopGroups = []
    } else {
        troopGroups = [
            ['soldier', 'knight', 'phalanx', 'shield'],
            ['charger', 'reaver', 'reaper'],
            ['archer', 'ewizard', 'fwizard'],
            ['summoner'],
            ['warlock'],
        ]
    }

    let utilButtonIds
    if (mode == 'sandbox') {
        utilButtonIds = ['rand_all', 'rand_blue', 'rand_red', 'erase', 'clear']
    } else if (mode == 'campaign') {
        utilButtonIds = ['erase', 'restart']
    } else if (mode == 'autochess') {
        utilButtonIds = []
    } else if (mode == 'siege') {
        utilButtonIds = []
    }
    this.buttons = []

    this.buttons.push(new Button(this.w / 2, buttonSize / 1.5, buttonSize * 2, buttonSize, 'return_to_title'))

    // Button locations are relative to menu location. Groups wrap at
    // buttonsPerRow same as before; a small gap is added BETWEEN groups so
    // roles read as visually distinct clusters instead of one undivided grid.
    let row = 0
    for (const group of troopGroups) {
        for (let i = 0; i < group.length; i++) {
            this.buttons.push(new Button(
                this.w / 2 - buttonsPerRow * buttonSize / 2 + 1.5 * buttonSize * int(i % buttonsPerRow),
                2 * buttonSize + (row + Math.floor(i / buttonsPerRow)) * buttonSize * 1.5,
                buttonSize, buttonSize, group[i]
            ));
        }
        row += Math.ceil(group.length / buttonsPerRow) + 0.35
    }

    for (let i = 0; i < utilButtonIds.length; i++) {
        this.buttons.push(new Button(this.w / 2 - 3 * buttonSize / 2 + 1.5 * buttonSize * int(i % 3), this.h * 0.8 + int(i / 3) * buttonSize * 1.5, buttonSize, buttonSize, utilButtonIds[i]));
    }

    // back in the drawer (the persistent bottom-center version was in the way)
    let startButtonSize = buttonSize * 1.3
    this.buttons.push(new Button(this.w / 2, this.h * 0.94, startButtonSize, startButtonSize, 'start'))

    this.show = function () {
        push()
        translate(this.x, this.y)
        fill(150, 200)
        noStroke()
        rectMode(CORNER)
        rect(0, 0, this.w, this.h, 0, this.w / 25, this.w / 25, 0)
        /*
        fill(0);
        textSize(this.w / 10);
        textAlign(CENTER, TOP)
        text("Menu", this.w / 2, -this.y + this.h / 100)
        */

        this.buttons.forEach(button => {
            button.show();
        })
        pop()
    }

    //Prompts a bit of the menu to show you need to click to open
    this.showBit = function () {
        push()
        translate(0, 0)
        fill(150, 100)
        noStroke()
        rectMode(CORNER)
        rect(0, 0, this.w / 16, this.h, 0, this.w / 25, this.w / 25, 0)
        pop()
    }

    this.onClick = function () {
        if (menuOpen) {
            this.buttons.forEach(button => {
                button.onClick();
            })
        }
    }
}