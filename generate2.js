var canv = canvas;

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
    engine.timing.timeScale = 1;

    // create a renderer
    var render = Render.create({
        element: document.body,
        canvas: canv,
        options: {
            width: 800,
            height: 800},
        engine: engine
    });

    var killTime = setTimeout( function(){ kill(render, engine)} , 10000);

    var shapes = [];

    var ground = Bodies.rectangle(500, 800, 1010, 60, {isStatic: true});
    var fruit0 = Bodies.circle(400, 50, 5);
    fruit0.collisionFilter.group = -7;
    var fruit1 = Bodies.circle(410, 50, 5);
    fruit1.collisionFilter.group = -7;

    shapes = [ground, fruit0, fruit1];

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

    Events.on(engine, 'collisionStart', function(event) {
        var pairs = event.pairs;
        var bodyA = pairs[0].bodyA;
        var bodyB = pairs[0].bodyB;

        // if one is floor and the other is fruit, level is beatable
        // returns -1 if level is a straight fall
        if((bodyA === fruit0 || bodyB === fruit0 || bodyA === fruit1 || bodyB === fruit1) && (bodyA === ground || bodyB === ground))
        {
            var a = fruit0.position.x == 400 ? 0 : 1;
            var b = shapes;
            var c = fruit1.position.x == 400 ? 0 : 1;

            console.log(a);
            console.log(b);

            clearTimeout(killTime);

            kill(render, engine);
        }
    });

    Events.on(engine, 'collisionActive', function(event) {
        var speed = fruit.speed;
        var angular = fruit.angularSpeed;
    });
}

function kill(render, engine)
{
    // stops render and makes it ready to restart

    Matter.Render.stop(render); // this only stop renderer but not destroy canvas
    Matter.World.clear(engine.world);
    Matter.Engine.clear(engine);

    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};

    gen();
}

gen();