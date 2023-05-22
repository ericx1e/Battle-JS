function AutochessEngine() {
    this.lives = 5
    this.gold = 10
    this.stage = 1

    let selectedTroop = undefined
    let shopWidth = width * 3 / 4
    let shopHeight = height / 4
    let shopX = width / 2
    let shopY = height - shopHeight / 1.5
    let shopButtonSize = shopHeight * 4 / 5
    // let shopButtonOffset = shopButtonS * 1.25
    let shopButtonOffset = shopWidth / 5

    this.shopButtons = []

    for (let i = 0; i < 5; i++) {
        this.shopButtons[i] = new Button(shopX - 2 * shopButtonOffset + shopButtonOffset * i, shopY, shopButtonSize, shopButtonSize, 'shop_soldier')
    }

    this.showShop = function () {
        fill(0, 100)
        noStroke()
        rectMode(CENTER)
        rect(shopX, shopY, shopWidth, shopHeight, shopWidth / 15, shopWidth / 15)

        this.shopButtons.forEach((button) => {
            button.show()
        })
    }

    this.onClick = function () {
        for (let i = 0; i < this.shopButtons.length; i++) {
            if (this.shopButtons[i].onClick()) {
                this.shopButtons.splice(i, 1)
            }
        }

        if (selectedTroop == undefined) {

        }
    }
}