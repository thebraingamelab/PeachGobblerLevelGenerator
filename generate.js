// uncomment this before deploying
//const db = firebase.firestore();

const RULE_DEBUG_MODE = true;

// module aliases
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

const canv = canvas;

// modified so it works with dimensions from Peach Gobbler player's config file
const SCREEN_WIDTH = 540;
const SCREEN_HEIGHT = 960;

// Magic number alert
// 640000 is the width * height used during initial development
const SIZE_FACTOR = Math.sqrt(SCREEN_WIDTH * SCREEN_HEIGHT / 640000);
const BALL_RADIUS = SCREEN_WIDTH / 20;

// used to generate statistics
let numBeatable = 0;
let total = 0;
let max = 0;

// for some reason, engine and render need be this high level or unexpected behaviors occur
let engine,
    render,

    // these variables need to be easily accessable during subsequent runs of gen()
    genshapes,
    encodedShapes,
    rule;


// I have no clue why, but setting the restitution as an option during the initial set stage does not work.
// need to set restitution property after initialization
function createLevelBorder(x) {
    let y = Bodies.rectangle(x, SCREEN_HEIGHT / 2, 2, SCREEN_HEIGHT, { isStatic: true });
    y.restitution = 0.5;
    return y;
}

// constant level geometry
const
    border0 = createLevelBorder(0),
    border1 = createLevelBorder(SCREEN_WIDTH),
    ground = Bodies.rectangle(SCREEN_WIDTH / 2 - 10, SCREEN_HEIGHT, SCREEN_WIDTH + 20, 400 * SIZE_FACTOR, { isStatic: true });
ground.collisionFilter.mask = -1;

// fruit construction
function makeFruit() {
    let fruit = [];
    fruit[0] = Bodies.circle(SCREEN_WIDTH / 2, 150 * SIZE_FACTOR, BALL_RADIUS);
    fruit[1] = Bodies.circle(SCREEN_WIDTH / 2 + BALL_RADIUS / 5, 150 * SIZE_FACTOR, BALL_RADIUS);
    fruit[2] = Bodies.circle(SCREEN_WIDTH / 2, 150 * SIZE_FACTOR + BALL_RADIUS / 5, BALL_RADIUS);
    fruit[3] = Bodies.circle(SCREEN_WIDTH / 2 - BALL_RADIUS / 5, 150 * SIZE_FACTOR, BALL_RADIUS);
    fruit[4] = Bodies.circle(SCREEN_WIDTH / 2, 150 * SIZE_FACTOR - BALL_RADIUS / 5, BALL_RADIUS);

    for (let i = 0; i < fruit.length; i++) {
        fruit[i].collisionFilter.group = -1;
        fruit[i].restitution = 0;
        fruit[i].render.strokeStyle = 'white';
        fruit[i].render.lineWidth = 3;
    }

    return fruit
}

function makeRule() {
    rule = makeRuleLogic();
    // for debugging purposes only
    let swappedRule = swap(rule[1]);
    console.log(`Rule is based on: ${rule[0]}\n${swappedRule[0]} is normal, ${swappedRule[1]} is bouncey, ${swappedRule[2]} is icey`);
}

// most important function
function gen(counter = 0) {
    // create an engine
    engine = Engine.create();

    // create a renderer
    render = Render.create({
        element: document.body,
        canvas: canv,
        options: {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            wireframes: false
        },
        engine: engine
    });

    engine.world.gravity.y = SIZE_FACTOR;

    // create all physical game objects
    shapes = [];

    let hits = 0;
    let beatable = false;
    let xposs = [];

    let fruit = makeFruit();

    shapes = [ground, border0, border1].concat(fruit);

    if (counter == 0) {
        if (!RULE_DEBUG_MODE) makeRule();
        make_geometry();
    }
    shapes = shapes.concat(genshapes);

    // add all of the bodies to the world
    World.add(engine.world, shapes);

    // run the engine
    Engine.run(engine);

    // sets timer for that kills the level and generates a new one after 8 seconds of inactivity
    let timeout = setTimeout(() => { resetTimeout(); killLevel(xposs, false, 4, fruit) }, 8000);
    const resetTimeout = () => clearTimeout(timeout);

    // run the renderer
    Render.run(render);

    // level is considered not beatable if fruit does not move from starting x position
    // deals with invalid levels
    Events.on(engine, 'collisionStart', function (event) {
        let pairs = event.pairs;
        let bodyA = pairs[0].bodyA;
        let bodyB = pairs[0].bodyB;

        if (bodyA === ground || bodyB === ground) {
            if (fruit[0].position.x == SCREEN_WIDTH / 2) {
                resetTimeout();
                killLevel(xposs, false);
            }
        }
    });

    // deals with detecting collisions on floor
    Events.on(engine, 'collisionActive', function (event) {
        let pairs = event.pairs;
        let bodyA = pairs[0].bodyA;
        let bodyB = pairs[0].bodyB;

        for (let i = 0; i < fruit.length; i++) {
            if ((bodyA === ground || bodyB === ground) && (bodyA === fruit[i] || bodyB === fruit[i])) {
                xposs[i] = fruit[i].position.x;

                // teleports fruits off screen to avoid extra collisions
                // maybe replace with object deletion?
                fruit[i].position.y = SCREEN_HEIGHT + 1000;
                hits++;
                beatable = hits >= fruit.length;

                if (beatable) {
                    resetTimeout();
                    killLevel(xposs, true);
                }
            }

            // code below adds a feature where levels are invalid if a fruit hits a wall
            // code was removed to better account for bouncey objects 

            // if (bodyA === border0 || bodyB === border0 || bodyA === border1 || bodyB === border1) {
            //     beatable = false;
            //     resetTimeout();
            //     killLevel(xposs, false);
            // }
        }
    });
}

const colorCodes = {
    0: 'green',
    1: 'blue',
    2: 'red'
}

// sets the global variables with the level geometry
function make_geometry() {
    // begin level generation section

    // generates random number of shapes between 3 and 10
    let rand = Math.ceil(Math.random() * 7) + 2;

    genshapes = [];
    encodedShapes = [];

    let shape_centers = [];

    for (let i = 0; i < rand; i++) {

        let randX, randY, shape, rot, prop, center, randshape;
        let contin = false;
        let color = colorCodes[Math.floor(Math.random() * 3)];
        let line_color = colorCodes[Math.floor(Math.random() * 3)];

        while (!contin) {
            randshape = Math.floor(Math.random() * 10);

            randX = (Math.random() * (SCREEN_WIDTH - 200 * SIZE_FACTOR) + 100 * SIZE_FACTOR);
            randY = (Math.random() * (SCREEN_HEIGHT - 585 * SIZE_FACTOR) + 250 * SIZE_FACTOR);

            shape;
            prop = {};
            rot;

            center = [NaN, NaN];

            // NOTE - all rotations are around the center of Matter object
            switch (randshape) {

                // 0 for square
                case 0:
                    let side = (Math.random() * (100 - BALL_RADIUS)) * SIZE_FACTOR + BALL_RADIUS;
                    prop = {
                        length: side
                    };
                    shape = Bodies.rectangle(randX, randY, side, side, { isStatic: true });
                    // valid rotations are between 10 and 80 degrees
                    rot = (Math.random() * 1.22 + 0.17) * Math.PI;

                    // find center of shape and add it to shape_centers
                    center[0] = randX + side / 2;
                    center[1] = randY + side / 2;
                    break;

                // 1 for circle
                case 1:
                    let radius = (Math.random() * (100 - BALL_RADIUS)) * SIZE_FACTOR + BALL_RADIUS;
                    prop = {
                        radius: radius
                    };
                    shape = Bodies.circle(randX, randY, radius, { isStatic: true });
                    rot = 0;

                    // find center of shape and add it to shape_centers
                    center[0] = randX + radius;
                    center[1] = randY + radius;
                    break;

                // 2 for isoceles triangle
                // 3 for right triangle
                case 2:
                case 3:
                    let slope = randshape - 1,
                        base = (Math.random() * (200 - BALL_RADIUS)) * SIZE_FACTOR + BALL_RADIUS,
                        tri_height = (Math.random() * (200 - BALL_RADIUS)) * SIZE_FACTOR + BALL_RADIUS;
                    prop = {
                        slope: slope,
                        width: base,
                        height: tri_height
                    }
                    shape = Bodies.trapezoid(randX, randY, base, tri_height, slope, { isStatic: true });
                    rot = Math.random() * 2 * Math.PI;

                    // find center of shape and add it to shape_centers
                    if (rot % Math.PI < Math.PI / 4 || rot % Math.PI > 3 * Math.PI / 4) {
                        center[0] = randX + base / 2;
                        center[1] = randY + tri_height / 2;
                    }
                    else {
                        center[0] = randX + tri_height / 2;
                        center[1] = randY + base / 2;
                    }
                    break;

                // default should never trigger. added here for contingency
                default:
                    console.log("this should not trigger");
                    console.log(randshape);

                // 4-7 for rectangle
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                    let width = (Math.random() * (200 - BALL_RADIUS)) * SIZE_FACTOR + BALL_RADIUS,
                        height = width / (Math.ceil((Math.random() * 5)) + 1);
                    prop = {
                        width: width,
                        height: height
                    };
                    shape = Bodies.rectangle(randX, randY, width, height, {
                        isStatic: true
                    });
                    // valid rotations are between -45 and -10 degrees and 10 and 45 degrees
                    // multiply decimals and pi to make rough radian amounts
                    // 50% chance of positive or negative rotation
                    rot = Math.pow(-1, Math.floor(Math.random() * 2)) * (Math.random() * 0.61 + 0.17);

                    // find center of shape and add it to shape_centers
                    center[0] = randX + width / 2;
                    center[1] = randY + height / 2;
            }

            // use this to determine if a shape should be placed
            contin = place_shape(center, shape_centers);
        }

        shape_centers.push(center);

        shape.collisionFilter.mask = -1;
        shape.friction = 0.05;
        shape.render.lineWidth = 10;

        shape.render.fillStyle = color;
        shape.render.strokeStyle = line_color;

        Body.rotate(shape, rot);
        genshapes[i] = shape;

        encodeShape = {
            xpos: randX,
            ypos: randY,
            shapeType: randshape,
            rotation: rot,
            properties: prop,
            color: color,
            line_color: line_color
        };
        encodedShapes[i] = encodeShape;

    }
    encodedShapes.forEach((eShape, i) => applyRules(eShape, i));
}

// function for turning 5 different shape ids into 3 named shapes
function shapeCodesToShape(shapeType) {
    switch (shapeType) {
        case 0:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
            return "rectangle";
        case 1:
            return "circle";
        default:
            return "triangle";
    }
}

// get shape info and convert it to material type based on rules
function applyRules(eShape, i) {
    let input;

    switch (rule[0]) {
        case "fill_colors":
            input = eShape.color;
            break;
        case "line_colors":
            input = eShape.line_color;
            break;
        case "shape":
            input = shapeCodesToShape(eShape.shapeType);

    }

    setProperties(rule[1][input], genshapes[i]);
}

// set the shapes to selected material
function setProperties(code, shape) {
    switch (code) {
        case 1:
            shape.restitution = 1;
            break;
        case 2:
            shape.friction = 0;
    }
}


// O(n) function to find closest shape center to point
function find_closest_distance(point, shape_centers) {
    if (shape_centers.length == 0) {
        return false;
    }
    let min_distance = Number.MAX_SAFE_INTEGER;
    for (center in shape_centers) {
        let distance = Math.sqrt(Math.pow(point[0] - center[0], 2) + Math.pow(point[1] - center[1], 2));
        min_distance = Math.min(distance, min_distance);
    }
    return min_distance;
}

// returns a boolean which determines if a shape should be placed
function place_shape(point, shape_centers) {
    const CON = -5;

    let closest_distance = find_closest_distance(point, shape_centers);
    if (closest_distance) {
        let val = Math.pow(E, CON * closest_distance);
        let rand = Math.random();
        return (rand > val);
    }
    return true;
}

// stops render and engine and makes it ready to restart
function killLevel(xposs, beatable, counter = 0, fruits = null) {
    console.log("Score:", beatable ? score(xposs) : -1);

    Render.stop(render);
    World.clear(engine.world);
    Engine.clear(engine);

    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};

    total++;

    console.log(`Ratio: ${numBeatable} : ${total} (${100 * numBeatable / total}%)`);
    if (counter != 0) {
        removeOne(fruits, counter);
    }
    else {
        gen();
    }
}

// for a given set of fruits, find all objects that collide with them
// used at the end for more complex level generation
function removeOne(fruits, counter) {
    let colliders = [];
    for (let i = 0; i < fruits.length; i++) {
        let x = genshapes.filter(shape => Matter.SAT.collides(fruits[i], shape).collided);
        colliders = colliders.concat(x);
    }
    if (colliders.length == 0 || genshapes.length == 3) {
        gen();
    }
    let i = genshapes.indexOf(colliders[parseInt(Math.random() * colliders.length)]);
    genshapes.splice(i, 1);
    encodedShapes.splice(i, 1);
    gen(counter);
}

// calculates variance
// used for scoring the difficulty of levels
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
// Uses variance formula as proxy
function score(xposs) {
    numBeatable++;
    let vari = variance(xposs);

    // uncomment this before deploying
    //saveGameplayData(vari, JSON.stringify(encodedShapes), rule[0], JSON.stringify(rule[1]);

    return vari;
}

// swaps key with value in dictionary
// for debugging purposes only
function swap(json) {
    var ret = {};
    for (var key in json) {
        ret[json[key]] = key;
    }
    return ret;
}

// Uploads data to cloud firestore
function saveGameplayData(sco, geo, ruleType, ruleString) {
    db.collection("PGLevels").add({
        score: sco,
        geometry: geo,
        rule_type: ruleType,
        rule: ruleString
    })
        .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(function (error) {
            console.error("Error adding document: ", error);
        });
}

if (RULE_DEBUG_MODE) makeRule();
gen();