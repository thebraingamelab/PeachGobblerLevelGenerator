// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

// create an engine
var engine = Engine.create();
engine.timing.timeScale = 1.2;

// create a renderer
var render = Render.create({
    element: document.body,
    canvas: canvas,
    options: {
        width: 800,
        height: 800},
    engine: engine
});
var shapes = [];

var rand = Math.ceil(Math.random() * 7) + 3;

var ground = Bodies.rectangle(500, 800, 1010, 60, {isStatic: true});
var fruit = Bodies.circle(400, 50, 5);
var base = Bodies.rectangle(400, 690, 100, 160, {isStatic: true});
var mouth = Bodies.rectangle(400, 615, 60, 20, {isStatic: true});
var teethA = Bodies.polygon(370, 600, 3, 20, {isStatic: true})
Body.rotate(teethA, 7 * (Math.PI/6));
var teethB = Bodies.polygon(430, 600, 3, 20, {isStatic: true})
Body.rotate(teethB, 7 * (Math.PI/6));

shapes = [ground, fruit, base, mouth, teethA, teethB];

for(var i = 0; i < rand; i++) {
    var randshape = Math.floor(Math.random() * 5);

    var randX = Math.random() * 600 + 100,
        randY = Math.random() * 300 + 150;
    
    var shape;

    switch(randshape){

        // 0 for square
        // default should never trigger. added here for contingency
        default:
        case 0:
            var side = Math.random() * 200 + 1;
            shape = Bodies.rectangle(randX, randY, side, side, {isStatic: true});
            break;

        // 1 for rectangle
        case 1:
            var width = Math.random() * 180 + 20,
                height = Math.random() * 180 + 20;
            shape = Bodies.rectangle(randX, randY, width, height, {isStatic: true});
            break;

        // 2 for circle
        case 2:
            var radius = Math.random() * 100 + 1;
            shape = Bodies.circle(randX, randY, radius, {isStatic: true});
            break;

        // 3 and 4 for isoceles or right triangle
        case 3:
        case 4:
            var slope = randshape - 2;
            var width = Math.random() * 180 + 20,
                height = Math.random() * 180 + 20;
            shape = Bodies.trapezoid(randX, randY, width, height, slope, {isStatic: true});
            break;
    }

    var rot = Math.random() * 2;

    Body.rotate(shape, Math.PI * rot);
    shapes[shapes.length] = shape;
}

// add all of the bodies to the world
World.add(engine.world, shapes);

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);

console.log(shapes);

Events.on(engine, 'collisionActive', function(event) {
    var speed = fruit.speed;
    var angular = fruit.angularSpeed;
    console.log(speed + " " + angular);
});