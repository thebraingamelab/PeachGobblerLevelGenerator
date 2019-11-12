var canv = canvas;
var beatable = 0;
var total = 0;

// all variables from gen are global to allow for data replacement
var engine,
    renderer,
    time,
    shapes,
    ground,
    hits,
    win,
    xposs,
    fruit,
    rand,
    genshapes,
    encodedShapes,
    rot,
    encodeShape;

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

function gen() {
    // create an engine
    engine = Engine.create();

    // create a renderer
    render = Render.create({
        element: document.body,
        canvas: canv,
        options: {
            width: 800,
            height: 800},
        engine: engine
    });

    time = setTimeout( function(){console.log("Score: " + score()); kill(render, engine); return;} , 5000);

    shapes = [];

    ground = Bodies.rectangle(500, 620, 1010, 60, {isStatic: true});
    ground.collisionFilter.mask = -1;

    hits = 0;
    win = false;
    xposs = [];

    fruit = [];
    fruit[0] = Bodies.circle(400, 50, 5);
    fruit[1] = Bodies.circle(401, 50, 5);
    fruit[2] = Bodies.circle(400, 51, 5);
    fruit[3] = Bodies.circle(399, 50, 5);
    fruit[4] = Bodies.circle(400, 49, 5);

    for(var i = 0; i < fruit.length; i++) {
        fruit[i].collisionFilter.group = -1;
    }

    shapes = [ground].concat(fruit);

    rand = Math.ceil(Math.random() * 7) + 3;

    genshapes = [];
    encodedShapes = [];

    for(var i = 0; i < rand; i++) {
        var randshape = Math.floor(Math.random() * 5);

        var randX = Math.random() * 600 + 100,
            randY = Math.random() * 250 + 150;
        
        var shape;
            prop = {};

        switch(randshape){

            // 0 for square
            // default should never trigger. added here for contingency
            default:
            case 0:
                var side = Math.random() * 200 + 1;
                prop = {
                    length : side
                };
                shape = Bodies.rectangle(randX, randY, side, side, {isStatic: true});
                break;

            // 1 for rectangle
            case 1:
                var width = Math.random() * 180 + 20,
                    height = Math.random() * 180 + 20;
                prop = {
                    width : width,
                    height : height
                };
                shape = Bodies.rectangle(randX, randY, width, height, {isStatic: true});
                break;

            // 2 for circle
            case 2:
                var radius = Math.random() * 100 + 1;
                prop = {
                    radius : radius
                };
                shape = Bodies.circle(randX, randY, radius, {isStatic: true});
                break;

            // 3 and 4 for isoceles or right triangle
            case 3:
            case 4:
                var slope = randshape - 2,
                    width = Math.random() * 180 + 20,
                    height = Math.random() * 180 + 20;
                prop = {
                    slope : slope,
                    width : width,
                    height : height
                }
                shape = Bodies.trapezoid(randX, randY, width, height, slope, {isStatic: true});
                break;
        }
        shape.collisionFilter.mask = -1;

        rot = Math.random() * 2 * Math.PI;

        Body.rotate(shape, rot);
        genshapes[i] = shape;

        encodeShape = {
            xpos : randX,
            ypos : randY,
            shapeType : randshape,
            rotation : rot,
            properties : prop
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

    //console.log(shapes);

    Events.on(engine, 'collisionStart', function(event) {
        var pairs = event.pairs;
        var bodyA = pairs[0].bodyA;
        var bodyB = pairs[0].bodyB;

        // level is considered not beatable if fruit does not move
        if((bodyA === fruit[0] || bodyB === fruit[0]) && (bodyA === ground || bodyB === ground)){
            if(fruit[0].position.x == 400) {
                console.log("Score: " + score());
                clearTimeout(time);
                kill(render, engine);
            }
        }
    });

    Events.on(engine, 'collisionActive', function(event) {
        var pairs = event.pairs;
        var bodyA = pairs[0].bodyA;
        var bodyB = pairs[0].bodyB;

        for(var i = 0; i < fruit.length; i++) {
            if((bodyA === fruit[i] || bodyB === fruit[i]) && (bodyA === ground || bodyB === ground)){
                xposs[i] = fruit[i].position.x;
                fruit[i].position.y = 1000;
                hits++;
                win = hits >= fruit.length;

                if(win)
                {
                    console.log("Score: " + score()); 
                    clearTimeout(time);
                    kill(render, engine);
                }
            }
        }
    });


    // Scoring algorithm
    // Finds distance from error fruit to real fruit, and adds it together
    function score()
    {
        // returns -1 if not beatable
        if(!win){
            return -1;
        }
        else{
            beatable++;
            // to check to see if they are at roughly the same elevation
        }
        var vari = variance(xposs)
            encode = {
                info : encodedShapes,
                score : vari
            };
        console.log(encode);
        console.log(JSON.stringify(encode));
        console.log();
        console.log(decode(JSON.stringify(encode)));
        return vari;
    }
}

// stops render and engine and makes it ready to restart

function kill(render, engine) {
    Matter.Render.stop(render); // this only stop renderer but not destroy canvas
    Matter.World.clear(engine.world);
    Matter.Engine.clear(engine);

    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};

    total++;

    console.log("Ratio: " + beatable + " : " + total + " (" + 100 * beatable/total + "%)");
    gen();
}

function variance(nums) {
    console.log("Nums: " + nums);
    var mean = 0,
        numerator = 0;
    for (var i = 0; i < nums.length; i++) {
        mean += nums[i];
    }
    mean /= nums.length;

    for (var i = 0; i < nums.length; i++) {
        numerator += Math.pow(nums[i] - mean, 2);
    }
    return numerator/(nums.length - 1);
}

function decode(shapesText){
    var parse = JSON.parse(shapesText).info;
        shapes = [];

    for(var i = 0; i < parse.length; i++) {
        var shape;

        switch(parse[i].shapeType){
            case 0:
                shape = Bodies.rectangle(parse[i].xpos, parse[i].ypos, parse[i].properties.length, parse[i].properties.length, {isStatic: true});
                break;
            case 1:
                shape = Bodies.rectangle(parse[i].xpos, parse[i].ypos, parse[i].properties.width, parse[i].properties.height, {isStatic: true});
                break;
            case 2:
                shape = Bodies.circle(parse[i].xpos, parse[i].ypos, parse[i].properties.radius, {isStatic: true});
                break;
            case 3:
            case 4:
                shape = Bodies.trapezoid(parse[i].xpos, parse[i].ypos, parse[i].properties.width, parse[i].properties.height, parse[i].properties.slope, {isStatic: true});
        }

        shape.collisionFilter.mask = -1;
        Body.rotate(shape, parse[i].rotation);

        shapes[i] = shape;
    }

    return shapes;
}

gen();