troops = [];

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.position(0, 0);
    troops.push(new Soldier(100, 100));
}

function draw() {
    background(200);
    fill(0);
    noStroke();
    textSize(20);
    text('fps: ' + Math.floor(frameRate()), 50, 50);
    strokeWeight(4);
    stroke(0);
    line(width / 2, 0, width / 2, height);

    troops.forEach(troop => {
        troop.move();
        c = color(255, 0, 0);
        troop.show(c);
    });
}

function mousePressed() {
    
}

var Animal = function(x) {
    this.x = x;
    console.log(x);
    if (this.constructor === Animal) {
      throw new Error("Can't instantiate abstract class!");
    }
};

Animal.prototype.say = function() {
    throw new Error("Abstract method!");
}

Animal.prototype.lol = function() {
    console.log("loooool");
}

var Cat = function(x) {
    Animal.apply(this, arguments);
};
Cat.prototype = Object.create(Animal.prototype);
Cat.prototype.constructor = Cat;

Cat.prototype.say = function() {
    console.log('meow');
}

var Dog = function() {
    Animal.apply(this, arguments);
};
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.say = function() {
    console.log('bark');
}

var cat = new Cat(9);
var dog = new Dog(1000);

cat.say();
dog.say();
cat.lol();