// "global" variables
var canMove = true;

var SCREEN_WIDTH = 375;
var SCREEN_HEIGHT = 667;
var SIZE_FACTOR = SCREEN_WIDTH * SCREEN_HEIGHT / 640000;

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
    canvas: canvas,
    options: {
        width: 800,
        height: 800},
    engine: engine
});

// creates all necessary game objects

var base = Bodies.rectangle(400, 690, 100,  160, {isStatic: true});
var mouth = Bodies.rectangle(400, 615, 60 , 20 , {isStatic: true});
var teethA = Bodies.polygon(370, 600, 3, 20 , {isStatic: true})
Body.rotate(teethA, 7 * (Math.PI/6));
var teethB = Bodies.polygon(430, 600, 3, 20 , {isStatic: true})
Body.rotate(teethB, 7 * (Math.PI/6));
var fruit = Bodies.circle(400, 50, 10 , {isStatic: true});
var ground = Bodies.rectangle(400, 800, 1000, 60 , {isStatic: true});
var butWidth = 100;
var butHeight = 50;
var button = Bodies.rectangle(700, 100, butWidth, butHeight, {isStatic: true});

/*var border0 = Bodies.rectangle(0, SCREEN_HEIGHT/2, 2, SCREEN_HEIGHT, {isStatic: true}),
    border1 = Bodies.rectangle(SCREEN_WIDTH, SCREEN_HEIGHT/2, 2, SCREEN_HEIGHT, {isStatic: true});*/


// add all of the bodies to the world
World.add(engine.world, [ground, base, fruit, teethA, teethB, mouth, button/*, border0, border1*/]);

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);

// activates on hold and drag
function move(event){
    if(canMove){
        var mousex = event.touches[0].clientX;

        Body.translate(mouth, {x: mousex - mouth.position.x, y: 0});
        Body.translate(teethA, {x: mousex - teethA.position.x - 30, y: 0});
        Body.translate(teethB, {x: mousex - teethB.position.x + 30, y: 0});
        Body.translate(base, {x: mousex - base.position.x, y: 0});
    }
}

// makes the player unable to move and starts the fruit's physics
function phase2(){
    canMove = false;
    Body.setStatic(fruit, false);
}

// checks if the start button is pressed
function startHuh(event){
    var mousex = event.touches[0].clientX;
    var mousey = event.touches[0].clientY;
    var butxrange = [button.position.x - butWidth/2, button.position.x + butWidth/2];
    var butyrange = [button.position.y - butHeight/2, button.position.y + butHeight/2];
    if(mousex >= butxrange[0] && mousex <= butxrange[1] && mousey >= butyrange[0] && mousey <= butyrange[1]){
        phase2();
    }
}

// runs collision events (win/lose)
Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    var bodyA = pairs[0].bodyA;
    var bodyB = pairs[0].bodyB;

    if(bodyA === fruit || bodyB === fruit)
    {
        // if one is mouth and the other is fruit, win condition
        if(bodyA === mouth || bodyB === mouth){
            console.log("win");
        }
        // if one is floor and the other is floor, lose
        if(bodyA === ground || bodyB === ground){
            console.log("lose");
        }
    }
});