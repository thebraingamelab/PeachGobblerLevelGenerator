var canv = canvas;
var beatable = 0;
var total = 0;

function gen() {
    // module aliases
    var Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Events = Matter.Events;

    // create an engine
    var engine = Engine.create();

    // create a renderer
    var render = Render.create({
        element: document.body,
        canvas: canv,
        options: {
            width: 800,
            height: 800},
        engine: engine
    });

    var killTime = setTimeout( function(){console.log("Score: " + score()); kill(render, engine);} , 5000);

    var shapes = [];

    var ground = Bodies.rectangle(500, 800, 1010, 60, {isStatic: true});
    ground.collisionFilter.mask = -1;

    var winable = false;

    // tried compressing into array, caused unexpected breaking.
    var fruit0 = Bodies.circle(400, 50, 5);
    fruit0.collisionFilter.group = -1;
    var fruit1 = Bodies.circle(401, 50, 5);
    fruit1.collisionFilter.group = -1;
    var fruit2 = Bodies.circle(400, 51, 5);
    fruit2.collisionFilter.group = -1;
    var fruit3 = Bodies.circle(399, 50, 5);
    fruit3.collisionFilter.group = -1;
    var fruit4 = Bodies.circle(400, 49, 5);
    fruit4.collisionFilter.group = -1;

    shapes = [ground, fruit0, fruit1, fruit2, fruit3, fruit4];

    var rand = Math.ceil(Math.random() * 7) + 3;

    for(var i = 0; i < rand; i++) {
        var randshape = Math.floor(Math.random() * 5);

        var randX = Math.random() * 600 + 100,
            randY = Math.random() * 250 + 150;
        
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
        shape.collisionFilter.mask = -1;

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

    //console.log(shapes);

    Events.on(engine, 'collisionStart', function(event) {
        var pairs = event.pairs;
        var bodyA = pairs[0].bodyA;
        var bodyB = pairs[0].bodyB;
        var once = true;

        // if one is floor and the other is fruit, level is beatable
        // level is considered not beatable if fruit does not move
        if((bodyA === fruit0 || bodyB === fruit0) && (bodyA === ground || bodyB === ground))
        {
            var a = fruit0.position.x != 400;
            var b = shapes;

            if(a && once){
                //console.log(b);
                once = false;
                beatable++;
                winable = true;
            }
        }
    });

    // Scoring algorithm
    // Finds distance from error fruit to real fruit, and adds it together
    function score()
    {
        // returns -1 if not beatable
        if(!winable){
            return -1;
        }
        else{
            var numCol = 0;

            // to check to see if they are at roughly the same elevation
            var y0 = Math.round(fruit0.position.y);
            var y1 = Math.round(fruit1.position.y);
            var y2 = Math.round(fruit2.position.y);
            var y3 = Math.round(fruit3.position.y);
            var y4 = Math.round(fruit4.position.y);

            var disp = 0;

            if(y0 == y1){
                disp += Math.abs(fruit0.position.x - fruit1.position.x)
                numCol++;
            }
            if(y0 == y2){
                disp += Math.abs(fruit0.position.x - fruit2.position.x)
                numCol++;
            }
            if(y0 == y3){
                disp += Math.abs(fruit0.position.x - fruit3.position.x)
                numCol++;
            }
            if(y0 == y4){
                disp += Math.abs(fruit0.position.x - fruit4.position.x)
                numCol++
            }
        }
        console.log("Collisions: " + numCol);
        return disp/numCol;
    }
}

// stops render and engine and makes it ready to restart

function kill(render, engine)
{
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

gen();