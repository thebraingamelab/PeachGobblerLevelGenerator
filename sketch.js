// constants
let SCREEN_WIDTH = 360;
let SCREEN_HEIGHT = 640;
let SIZE_FACTOR = SCREEN_WIDTH * SCREEN_HEIGHT / 640000;

let BALL_RADIUS = SCREEN_WIDTH/20;
let MOUTH_SIZE = SCREEN_WIDTH/5;

// module aliases
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

let engine;

let render;

// creates all necessary game objects
let base = Bodies.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 110 * SIZE_FACTOR, 100 * SIZE_FACTOR, 160 * SIZE_FACTOR, { isStatic: true });
let mouth = Bodies.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 170 * SIZE_FACTOR, MOUTH_SIZE, MOUTH_SIZE/2, { isStatic: true });
let teethA = Bodies.polygon(SCREEN_WIDTH / 2 - 30 * SIZE_FACTOR, SCREEN_HEIGHT - 200 * SIZE_FACTOR, 3, 20 * SIZE_FACTOR, { isStatic: true })
Body.rotate(teethA, 7 * (Math.PI / 6));
let teethB = Bodies.polygon(SCREEN_WIDTH / 2 + 30 * SIZE_FACTOR, SCREEN_HEIGHT - 200 * SIZE_FACTOR, 3, 20 * SIZE_FACTOR, { isStatic: true })
Body.rotate(teethB, 7 * (Math.PI / 6));
let fruit;
let ground = Bodies.rectangle(SCREEN_WIDTH / 2 - 10, SCREEN_HEIGHT, SCREEN_WIDTH + 20, 110 * SIZE_FACTOR, { isStatic: true });
ground.collisionFilter.mask = -1;
let butWidth = 150 * SIZE_FACTOR;
let butHeight = 100 * SIZE_FACTOR;
let button = Bodies.rectangle(SCREEN_WIDTH - butHeight * 1.5, butHeight * 1.5, butWidth, butHeight, { isStatic: true });

let canMovePlayer = true;

let x = Bodies.circle(50, 50, 50, {isStatic : true});
let y = Bodies.circle(25, 25, 25, {isStatic : true});

let levelQueue = [[x], [y], [x], [y]];

function render_func() {

    canMovePlayer = true;

    // creates an engine
    engine = Engine.create()

    // Makes gravity that scales with height
    // for some reason, at SIZE_FACTOR, collisions are not detected but they are at 95% original speed 
    engine.world.gravity.y = SIZE_FACTOR * .95;

    // why does fruit keep it's gravity?
    // it should clear after intitializing the new fruit
    // maybe place an object under it that's invisible?
    // or make a super script that intializes this script every time
    fruit = Bodies.circle(SCREEN_WIDTH / 2, 50, BALL_RADIUS, {isStatic : true});
    fruit.collisionFilter.group = -1;

    // create a renderer
    render = Render.create({
        element: document.body,
        canvas: canvas,
        options: {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        },
        engine: engine
    });

    // add all of the bodies to the world
    if(levelQueue.length != 0) {
        World.add(engine.world, [ground, base, fruit, teethA, teethB, mouth, button].concat(levelQueue.shift())/*.concat(decode(levelQueue.shift()))*/);
    }

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);

    // runs collision events (win/lose)
    Events.on(engine, 'collisionStart', function (event) {
        let pairs = event.pairs;
        let bodyA = pairs[0].bodyA;
        let bodyB = pairs[0].bodyB;

        if (bodyA === fruit || bodyB === fruit) {
            // if one is mouth and the other is fruit, win condition
            if (bodyA === mouth || bodyB === mouth) {
                console.log("win");
                // uses the difference in position of the bodies to calculate accuracy
                console.log(Math.abs(bodyA.position.x - bodyB.position.x));
                clear();
            }
            // if one is ground and the other is fruit, lose
            if (bodyA === ground || bodyB === ground) {
                console.log("lose");
                clear();
            }
        }
    });
}

function clear() {
    console.log("cleared");
    World.clear(engine.world);
    Engine.clear(engine);
    Render.stop(render);
    render.context = null;
    render.textures = {};

    render_func();
}

// activates on hold and drag
function move(event) {
    if (canMovePlayer) {
        let mousex = event.touches[0].clientX;
        if (mousex > SCREEN_WIDTH) {
            mousex = SCREEN_WIDTH;
        }
        if (mousex < 0) {
            mousex = 0;
        }

        Body.translate(mouth, { x: mousex - mouth.position.x, y: 0 });
        Body.translate(teethA, { x: mousex - teethA.position.x - 30 * SIZE_FACTOR, y: 0 });
        Body.translate(teethB, { x: mousex - teethB.position.x + 30 * SIZE_FACTOR, y: 0 });
        Body.translate(base, { x: mousex - base.position.x, y: 0 });
    }
}

// makes the player unable to move and starts the fruit's physics
function phase2() {
    canMovePlayer = false;
    Body.setStatic(fruit, false);
}

// checks if the start button is pressed
function startButtonPressed(event) {
    let mousex = event.touches[0].clientX;
    let mousey = event.touches[0].clientY;
    let butxrange = [button.position.x - butWidth / 2, button.position.x + butWidth / 2];
    let butyrange = [button.position.y - butHeight / 2, button.position.y + butHeight / 2];
    if (mousex >= butxrange[0] && mousex <= butxrange[1] && mousey >= butyrange[0] && mousey <= butyrange[1]) {
        phase2();
    }
}

// takes in a level json, returns the level as an array of Matte.js Bodies
function decode(shapesText) {
    let parse = JSON.parse(shapesText);
    console.log(parse);
    shapes = [];

    for (let i = 0; i < parse.length; i++) {
        let shape;

        switch (parse[i].shapeType) {
            case 0:
                shape = Bodies.rectangle(parse[i].xpos, parse[i].ypos, parse[i].properties.length, parse[i].properties.length, { isStatic: true });
                break;
            case 1:
                shape = Bodies.rectangle(parse[i].xpos, parse[i].ypos, parse[i].properties.width, parse[i].properties.height, { isStatic: true });
                break;
            case 2:
                shape = Bodies.circle(parse[i].xpos, parse[i].ypos, parse[i].properties.radius, { isStatic: true });
                break;
            // possibly remove/revise triangles/trapezoids to deal with phasing issue
            // phasing issues seem to be resolved with bigger fruit and slower gravity
            case 3:
            case 4:
                shape = Bodies.trapezoid(parse[i].xpos, parse[i].ypos, parse[i].properties.width, parse[i].properties.height, parse[i].properties.slope, { isStatic: true });
        }

        shape.collisionFilter.mask = -1;
        shape.friction = 0.025;
        Body.rotate(shape, parse[i].rotation);

        shapes[i] = shape;
    }

    return shapes;
}

render_func();