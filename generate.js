//const db = firebase.firestore();

// module aliases
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

// global variables
let canv = canvas;
let beatable = 0;
let total = 0;
let max = 0;

// modified so it works with config dimensions from Peach Gobbler player
let SCREEN_WIDTH = 540;
let SCREEN_HEIGHT = 960;

// Magic number alert
// 640000 is the width * height used during initial development
let SIZE_FACTOR = Math.sqrt(SCREEN_WIDTH * SCREEN_HEIGHT / 640000);
let BALL_RADIUS = SCREEN_WIDTH/20;

// all variables from gen are global to allow for data replacement
let engine,
    render,
    time,
    border0,
    border1,
    shapes,
    ground,
    hits,
    win,
    xposs,
    fruit,
    rand,
    genshapes,
    encodedShapes;

function gen() {
    // create an engine
    engine = Engine.create();

    // create a renderer
    render = Render.create({
        element: document.body,
        canvas: canv,
        options: {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        },
        engine: engine
    });

    engine.world.gravity.y = SIZE_FACTOR;

    // sets timer for 5 seconds that kills the level and generates a new one after 8 seconds of inactivity
    time = setTimeout(function () { kill(render, engine); }, 8000);

    // create all physical game objects
    shapes = [];

    border0 = Bodies.rectangle(0, SCREEN_HEIGHT / 2, 2, SCREEN_HEIGHT, { isStatic: true });
    border1 = Bodies.rectangle(SCREEN_WIDTH, SCREEN_HEIGHT / 2, 2, SCREEN_HEIGHT, { isStatic: true });

    ground = Bodies.rectangle(SCREEN_WIDTH / 2 - 10, SCREEN_HEIGHT, SCREEN_WIDTH + 20, 400 * SIZE_FACTOR, { isStatic: true });
    ground.collisionFilter.mask = -1;

    hits = 0;
    win = false;
    xposs = [];

    fruit = [];
    fruit[0] = Bodies.circle(SCREEN_WIDTH / 2, 150 * SIZE_FACTOR, BALL_RADIUS);
    fruit[1] = Bodies.circle(SCREEN_WIDTH / 2 + BALL_RADIUS / 5, 150 * SIZE_FACTOR, BALL_RADIUS);
    fruit[2] = Bodies.circle(SCREEN_WIDTH / 2, 150 * SIZE_FACTOR + BALL_RADIUS / 5, BALL_RADIUS);
    fruit[3] = Bodies.circle(SCREEN_WIDTH / 2 - BALL_RADIUS / 5, 150 * SIZE_FACTOR, BALL_RADIUS);
    fruit[4] = Bodies.circle(SCREEN_WIDTH / 2, 150 * SIZE_FACTOR - BALL_RADIUS / 5, BALL_RADIUS);

    for (let i = 0; i < fruit.length; i++) {
        fruit[i].collisionFilter.group = -1;
    }

    shapes = [ground, border0, border1].concat(fruit);

    // generates random number of shapes
    rand = Math.ceil(Math.random() * 7) + 2;

    genshapes = [];
    encodedShapes = [];

    for (let i = 0; i < rand; i++) {
        let randshape = Math.floor(Math.random() * 10);

        let randX = (Math.random() * (SCREEN_WIDTH - 200 * SIZE_FACTOR) + 100 * SIZE_FACTOR),
            randY = (Math.random() * (SCREEN_HEIGHT - 585 * SIZE_FACTOR) + 250 * SIZE_FACTOR);

        let shape;
        prop = {};
        let rot; 

        switch (randshape) {

            // 0 for square
            // default should never trigger. added here for contingency
            default:
            case 0:
                let side = (Math.random() * (100 - BALL_RADIUS) + BALL_RADIUS) * SIZE_FACTOR;
                prop = {
                    length: side
                };
                shape = Bodies.rectangle(randX, randY, side, side, { isStatic: true });
                // valid rotations are between 10 and 80 degrees
                rot = (Math.random() * 0.39 + 0.06) * Math.PI;
                break;

            // 1 for circle
            case 1:
                let radius = (Math.random() * (100 - BALL_RADIUS) + BALL_RADIUS) * SIZE_FACTOR;
                prop = {
                    radius: radius
                };
                shape = Bodies.circle(randX, randY, radius, { isStatic: true });
                rot = 0;
                break;

            // 2 for isoceles triangle
            // 3 for right triangle
            case 2:
            case 3:
                let slope = randshape - 1,
                    base = (Math.random() * (200 - BALL_RADIUS) + BALL_RADIUS) * SIZE_FACTOR,
                    tri_height = (Math.random() * (200 - BALL_RADIUS) + BALL_RADIUS) * SIZE_FACTOR;
                prop = {
                    slope: slope,
                    width: base,
                    height: tri_height
                }
                shape = Bodies.trapezoid(randX, randY, base, tri_height, slope, { isStatic: true });
                rot =  Math.random() * 2 * Math.PI;
                break;

            // 4-7 for rectangle
            case 4:
            case 5:
            case 6:
            case 7:
            case 9:
                let width = (Math.random() * (200 - BALL_RADIUS) + BALL_RADIUS) * SIZE_FACTOR,
                    height = width/(Math.ceil((Math.random() * 5))+1);
                prop = {
                    width: width,
                    height: height
                };
                shape = Bodies.rectangle(randX, randY, width, height, { isStatic: true });
                // valid rotations are between -45 and -10 degrees and 10 and 45 degrees
                rot = Math.pow(-1, Math.floor(Math.random() * 2)) * (Math.random() * 0.19 + 0.06);
                break;
        }
        shape.collisionFilter.mask = -1;
        shape.friction = 0.025;

        Body.rotate(shape, rot);
        genshapes[i] = shape;

        encodeShape = {
            xpos: randX,
            ypos: randY,
            shapeType: randshape,
            rotation: rot,
            properties: prop
        };
        encodedShapes[i] = encodeShape;
    }

    shapes = shapes.concat(genshapes);

    // add all of the bodies to the world
    World.add(engine.world, shapes);

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);

    // deals with invalid levels
    Events.on(engine, 'collisionStart', function (event) {
        let pairs = event.pairs;
        let bodyA = pairs[0].bodyA;
        let bodyB = pairs[0].bodyB;

        // level is considered not beatable if fruit does not move
        if (bodyA === ground || bodyB === ground) {
            if (fruit[0].position.x == SCREEN_WIDTH / 2) {
                clearTimeout(time);
                kill(render, engine);
            }
        }
    });

    // deals with detecting collisions on walls or multiple on floor
    Events.on(engine, 'collisionActive', function (event) {
        let pairs = event.pairs;
        let bodyA = pairs[0].bodyA;
        let bodyB = pairs[0].bodyB;

        for (let i = 0; i < fruit.length; i++) {
            if ((bodyA === ground || bodyB === ground) && (bodyA === fruit[i] || bodyB === fruit[i])) {
                xposs[i] = fruit[i].position.x;
                // teleports fruits off screen to avoid extra collisions
                fruit[i].position.y = SCREEN_HEIGHT + 1000;
                hits++;
                win = hits >= fruit.length;

                if (win) {
                    clearTimeout(time);
                    kill(render, engine);
                }
            }

            if (bodyA === border0 || bodyB === border0 || bodyA === border1 || bodyB === border1) {
                win = false;
                clearTimeout(time);
                kill(render, engine);
            }
        }
    });
}

// stops render and engine and makes it ready to restart

function kill(render, engine) {
    console.log("Score: " + score());

    Matter.Render.stop(render); // this only stops renderer but does not destroy canvas
    Matter.World.clear(engine.world);
    Matter.Engine.clear(engine);

    render.canvas.remove(); // this removes the canvas
    render.canvas = null;
    render.context = null;
    render.textures = {};

    total++;

    console.log("Ratio: " + beatable + " : " + total + " (" + 100 * beatable / total + "%)");
    gen();
}

// calculates variance
function variance(nums) {
    let mean = 0,
        numerator = 0;
    for (let i = 0; i < nums.length; i++) {
        mean += nums[i];
    }
    mean /= nums.length;

    for (let i = 0; i < nums.length; i++) {
        numerator += Math.pow(nums[i] - mean, 2);
    }
    return numerator / (nums.length - 1);
}

// Scoring algorithm
// Uses variance to calculate scoring
function score() {
    // returns -1 if not beatable
    if (!win) {
        return -1;
    }
    beatable++;
    let vari = variance(xposs);

    //saveGameplayData(vari, JSON.stringify(encodedShapes));

    return vari;
}


// Uploads data to cloud firestore
function saveGameplayData(sco, geo) {
    db.collection("PGLevels").add({
        score: sco,
        geometry: geo
    })
    .then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
    });
}

gen();