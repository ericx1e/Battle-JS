function Button(x, y, s, id) {
    this.x = x
    this.y = y
    this.s = s
    this.model;

    switch (id) {
        case 'soldier':
            this.model = new Soldier(this.x, this.y - this.s / 8, 'blue');
            break;
        case 'archer':
            this.model = new Archer(this.x, this.y - this.s / 8, 'blue');
            break;
    }

    this.show = function () {
        rectMode(CENTER)
        noStroke()

        if (this.model) {
            if (this.isTouchingMouse()) {
                fill(230)
            } else {
                fill(255)
            }
            rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
            this.model.show()
            fill(0)
            textAlign(CENTER, CENTER)
            textSize(this.s / 4)
            text(id, this.x, this.y + this.s / 4)
        } else {
            switch (id) {
                case 'start':
                    let tx;
                    if (battling) {
                        if (this.isTouchingMouse()) {
                            fill(230, 120, 120)
                        } else {
                            fill(255, 130, 130)
                        }
                        tx = 'stop'
                    } else {
                        if (this.isTouchingMouse()) {
                            fill(120, 230, 120)
                        } else {
                            fill(130, 255, 130)
                        }
                        tx = 'start'
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text(tx, this.x, this.y)
                    break
                case 'rand_all':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text('all' + '\n' + 'random', this.x, this.y)
                    break
                case 'erase':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text(id, this.x, this.y)
                    break
                case 'clear':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text(id, this.x, this.y)
                    break
                case 'mode':
                    if (this.isTouchingMouse()) {
                        fill(185)
                    } else {
                        fill(210)
                    }
                    rect(this.x, this.y, this.s, this.s, this.s / 5, this.s / 5)
                    fill(0)
                    textAlign(CENTER, CENTER)
                    textSize(this.s / 4)
                    text(id, this.x, this.y)
                    break
            }
        }
    }

    this.onClick = function () {
        if (this.isTouchingMouse()) {
            if (this.model) {

            } else {
                switch (id) {
                    case 'start':
                        battling = !battling;
                        break
                }
            }
        }
    }

    this.isTouchingMouse = function () {
        return mouseX > this.x - this.s / 2 && mouseX < this.x + this.s / 2 && mouseY > this.y - this.s / 2 && mouseY < this.y + this.s / 2
    }
}