function Menu() {
    this.w = width / 5
    this.h = height
    this.x = -this.w;
    this.y = 0

    let buttonsPerRow = 3

    let buttonSize = this.h / 15
    let troopButtonIds = ['soldier', 'archer', 'soldier', 'soldier']
    let utilButtonIds = ['rand_all', 'rand_blue', 'rand_red', 'erase', 'clear', 'mode']
    this.buttons = []

    // Button locations are relative to menu location
    for (let i = 0; i < troopButtonIds.length; i++) {
        this.buttons.push(new Button(this.w / 2 - buttonsPerRow * buttonSize / 2 + 1.5 * buttonSize * int(i % buttonsPerRow), this.h / 10 + int(i / buttonsPerRow) * buttonSize * 1.5, buttonSize, troopButtonIds[i]));
    }

    for (let i = 0; i < utilButtonIds.length; i++) {
        this.buttons.push(new Button(this.w / 2 - 3 * buttonSize / 2 + 1.5 * buttonSize * int(i % 3), this.h * 7 / 10 + int(i / 3) * buttonSize * 1.5, buttonSize, utilButtonIds[i]));
    }
    this.buttons.push(new Button(this.w / 2, this.h * 9 / 10, buttonSize * 1.5, 'start'))

    this.show = function () {
        push()
        translate(this.x, this.y)
        fill(150, 200)
        noStroke()
        rectMode(CORNER)
        rect(0, 0, this.w, this.h, 0, this.w / 25, this.w / 25, 0)
        fill(0);
        textSize(this.w / 10);
        textAlign(CENTER, TOP)
        text("Menu", this.w / 2, -this.y + this.h / 100)

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
        this.buttons.forEach(button => {
            button.onClick();
        })
    }
}