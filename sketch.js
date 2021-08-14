function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.position(0, 0);
}

function draw() {
    background(200);
    fill(0);
    line(width / 2, 0, width / 2, height);

}