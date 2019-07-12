var target = 0;
var testFlag = -1;
var startFlag = 0;
var clicks = [];
var agent_coords = [];
var question = 0;
var question_type = 0;
var image_size=50;
var font = 50;
var simulator;
var interval;
var MTurkForm;

//SANDBOX URL
var URL = "https://workersandbox.mturk.com/mturk/externalSubmit";

//REAL URL
//var URL = "https://www.mturk.com/mturk/externalSubmit";
//get DPI
dpi = window.devicePixelRatio;
canvas = null;
w = 0;
h = 0;
fabric.Canvas.prototype.getItemByName = function(name) {
  var object = null,
      objects = this.getObjects();

  for (var i = 0, len = this.size(); i < len; i++) {
    if (objects[i].name && objects[i].name === name) {
      object = objects[i];
      break;
    }
  }

  return object;
};
function fix_dpi() {
  //get CSS height
  //the + prefix casts it to an integer
  //the slice method gets rid of "px"
  let style_height = +getComputedStyle(document.getElementById('cwrapper')).getPropertyValue("height").slice(0, -2);
  //get CSS width
  let style_width = +getComputedStyle(document.getElementById('cwrapper')).getPropertyValue("width").slice(0, -2);
  //scale the canvas
  if(canvas)
  {
    canvas.setHeight(style_height * dpi);
    canvas.setWidth(style_width * dpi);
  }
  else
  {
    document.getElementById('board').setAttribute('height', style_height * dpi);
    document.getElementById('board').setAttribute('width', style_width * dpi);
  }
  h = style_height * dpi;
  w = style_width * dpi;
  image_size = style_width * dpi/35;
  font = parseInt(style_width * dpi/35,10);
}
var Board = function() {
  //fix_dpi();

  /*
  this.drawObstacles = function(simulator) {
    var obstacles = simulator.getObstacles();

    if (obstacles.length) {
      ctx.fillStyle = "rgb(100,100,100)";
      ctx.beginPath();
      ctx.moveTo(obstacles[0].point.x + w/2, obstacles[0].point.y + h/2);
      for (var i=1; i<obstacles.length; i++) {
        ctx.lineTo(obstacles[i].point.x + w/2, obstacles[i].point.y + h/2);
      }
      ctx.closePath();
      ctx.fill();
    }
  };*/

  this.drawAgents = function(simulator) {
    for (var i=0; i<NUM_AGENTS; i++) {
      //canvas = new fabric.Canvas('board');
      var pos = simulator.getAgentPosition(i);
      var radius = simulator.getAgentRadius(i);
      var imgInstance = new fabric.Image(imgs[i], {
        left: pos.x+w/2-image_size/2,
        top: pos.y+h/2-image_size/2,
        selectable:false,
        scaleX:image_size/500,
        scaleY:image_size/500
      });
      canvas.add(imgInstance);
    }
  };

  this.draw = function(simulator) {
    fix_dpi();
    this.reset();
    //this.drawObstacles(simulator);
    this.drawAgents(simulator);
  }

  this.reset = function() {
    if(canvas)
    {
      canvas.clear();
    }
    else
    {
      var ctx = document.getElementById('board').getContext('2d');
      ctx.clearRect(0,0,w,h);
    }
  }
}

var setPreferredVelocities = function(simulator) {
  //fix_dpi();

  var stopped = 0;
  for (var i = 0; i < NUM_AGENTS; ++i) {
    if (RVOMath.absSq(simulator.getGoal(i).minus(simulator.getAgentPosition(i))) < 100) {
      // Agent is within three radii of its goal, change goal
      new_x = Math.random()*(w-100)-(w-100)/2;
      new_y = Math.random()*(h-100)-(h-100)/2;
      simulator.setGoal(i,new Vector2(new_x,new_y));
    }

    simulator.setAgentPrefVelocity(i, RVOMath.normalize (simulator.getGoal(i).minus(simulator.getAgentPosition(i))));
  }
  return stopped;
}

var board = new Board();
var setupScenario = function(simulator)
{
  //fix_dpi();
  w = canvas.getWidth();
  h = canvas.getHeight();

  // Specify global time step of the simulation.
  var speed = new Number(.4);
  simulator.setTimeStep(speed);

  // Specify default parameters for agents that are subsequently added.
  var velocity = new Vector2(1, 1);
  var radius = image_size/2+5; // TODO validate
  simulator.setAgentDefaults(
      radius*radius, // neighbor distance (min = radius * radius)
      30, // max neighbors
      600, // time horizon
      600, // time horizon obstacles
      radius, // agent radius
      1, // max speed
      velocity // default velocity
    );

  if(question == 0)
  {
    for (var i=0; i<NUM_AGENTS; i++) {
      var angle = i * (2*Math.PI) / NUM_AGENTS;
      var x = Math.random()*(w-100)-(w-100)/2;
      var y = Math.random()*(h-100)-(h-100)/2;
      simulator.addAgent(new Vector2 (x,y));
    }

    // Create goals
    var goals = [];
    for (var i = 0; i < NUM_AGENTS; ++i) {
      var x = Math.random()*(w-100)-(w-100)/2;
      var y = Math.random()*(h-100)-(h-100)/2;
      goals.push(new Vector2 (x,y));
    }
    simulator.addGoals(goals);
  }

  // Add (polygonal) obstacle(s), specifying vertices in counterclockwise order.
  var vertices = [];

  if ($("#obstacles").checked) {
    for (var i=0; i<3; i++) {
      var angle = i * (2*Math.PI) / 3;
      var x = Math.cos(angle) * 50;
      var y = Math.sin(angle) * 50;
      vertices.push(new Vector2(x,y));
    }
  }

  testFlag = 0;
  clicks = [];
  agent_coords = [];

  simulator.addObstacle(vertices);

  // Process obstacles so that they are accounted for in the simulation.
  simulator.processObstacles();
}

var run = function() {
  if(question > practice_questions)
  {
    //set question type to experimental
    question_type = 1;
  }
  if(question == 0)
  {
    //make a new instance of simulator (kind of a singleton) and reset board
    simulator=Simulator.instance= new Simulator();

    //set time limit for movement (random interval between 7 and 20 seconds)
    simulator.limit = 100;

  }
  else {
    //if this isn't the first question, get singleton(ish) instance of simulator
    simulator =Simulator.instance;
    //set time limit for movement (random interval between 7 and 20 seconds)
    simulator.limit = (Math.random()*13+7)*1000;
  }

  //make sure timer isnt running during setup
  clearInterval(interval);

  //run setup
  setupScenario(simulator);

  //remember when simulator was started
  var d_1 = new Date();
  start = d_1.getTime();

  var step = function() {

    //update velocities, run collision detection, draw agents
    setPreferredVelocities(simulator);
    simulator.run();
    board.draw(simulator);

    //if we have reached time limit, begin testing subject
    var d_2 = new Date();
    if (d_2.getTime() - start > simulator.limit) {
      clearInterval(interval);
      if(question == 0)
      {
        var text = new fabric.Text('The test will begin when you click.', { left: w/2, top: h/2,fontSize:font,selectable:false, textAlign: 'center' ,selectable:false});
        canvas.add(text);
        testFlag = 2;
      }
      else
      {
        test();
      }
    }
  }

  //how often does the simulator step
  interval = setInterval(step, 1);
}
var test = function()
{

  for (var i=0; i<NUM_AGENTS; i++) {

    var pos = simulator.getAgentPosition(i);
    agent_coords.push([pos.x,pos.y]);

    var radius = simulator.getAgentRadius(i);
    var circle = new fabric.Circle({radius: radius+5, fill: 'red', left: pos.x + w/2-3*image_size/4, selectable:false,top: pos.y + h/2-3*image_size/4,name:`circle_${i}`});
    canvas.add(circle)
    var imgInstance = new fabric.Image(imgs[i], {
      left: w-image_size*5,
      top: image_size*2*(i-NUM_AGENTS/2) + h/2,
      selectable:true,
      hasControls:false,
      hasBorders:false,
      hasRotatingPoint:false,
      scaleX:image_size/500,
      scaleY:image_size/500
    });
    canvas.add(imgInstance);
  }
  /*
  var text = new fabric.Text('Click on the', { left: w/2-image_size/4, top: 3*image_size/2,fontSize:3*font/4,selectable:false, textAlign: 'center' ,selectable:false});
  canvas.add(text);

  var imgInstance = new fabric.Image(imgs[target], {
    left: pos.x+w/2-image_size/2,
    top: pos.y+h/2-image_size/2,
    selectable:false,
    scaleX:image_size/500,
    scaleY:image_size/500
  });
  canvas.add(imgInstance);
  */
  testFlag = 1;
}

$(document).ready(function() {
  //get MTurk Form from index.html and populate it with mturk data
  MTurkForm = $('#TurkForm');
  //MTurkForm.action = URL;
  //MTurkForm['assignmentId'] = assignmentID;
  //get drawing variables


  fix_dpi();

  //draw starting text
  if(testFlag == -1)
  {
    fix_dpi();
    var ctx = document.getElementById('board').getContext('2d');
    ctx.fillStyle = "black";
    ctx.font = `${font}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("Welcome to the Multiple Object Awareness Test. Click to continue...", w/2, h/2);
    startFlag++;
  }

  //handles clicking on canvas
  $('#board').click(function(e){
    e.stopPropagation();
    e.preventDefault();
    e.stopImmediatePropagation();
    var x = e.clientX
      , y = e.clientY;
    console.log(startFlag);
    if(testFlag == -1)
    {
      board.reset();
      fix_dpi();
      ctx.fillStyle = "black";
      ctx.font = `${font}px Arial`;
      ctx.textAlign = "center";
      if(startFlag == 1)
      {
        ctx.fillText("A group of animals will appear on screen. When you are ready,", w/2, h/2-(font));
        ctx.fillText("click anywhere and they will begin to move.", w/2, h/2);
        ctx.fillText("Click to continue...", w/2, h/2 + (font));
      }
      if(startFlag == 2)
      {
        ctx.fillText("Try to keep track of their locations to the best of your ability.", w/2, h/2-(font+3*font/4));
        ctx.fillText("After a few seconds, the animals will freeze and be covered up.",w/2, h/2-(3*font/4));
        ctx.fillText("You have to match the animals on the right to the covered up ones.",w/2, h/2+(3*font/4));
        ctx.fillText("Click to continue...", w/2, h/2 + (font+3*font/4));
      }
      if(startFlag == 3)
      {
        ctx.fillText("Try to be as accurate as possible",w/2, h/2-(font));
        //ctx.fillText("Try to click as few times as possible.",w/2, h/2);
        ctx.fillText("Click to continue...", w/2, h/2 + (font));
      }
      if(startFlag == 4)
      {

        ctx.fillText(`There are ${practice_questions+experimental_questions} questions in each HIT (${practice_questions} practice, ${experimental_questions} experimental),`,w/2, h/2-(font));
        ctx.fillText("and you must complete all 4 HITs to recieve approval.",w/2, h/2);
        ctx.fillText("Click to continue...", w/2, h/2 + (font));
      }
      if(startFlag == 5)
      {
        canvas = new fabric.Canvas('board');
        canvas.on('drop',function(options){
          console.log(options);
          if(testFlag == 1)
          {
            console.log(options);
            if(options.target)
            {
              console.log(options.target.name);
              clicks.push(options.target.name);
              canvas.remove(canvas.findTarget(options.target));
            }
          }
        });
        var revealed = new Array(NUM_AGENTS);
        for (var i=0; i<NUM_AGENTS; i++)
          revealed[i] = 0;
        canvas.on('mouse:up',function(options){
          //are we testing?
          x = options.e.clientX;
          y = options.e.clientY;
          if(testFlag == 1)
          {
            if(options.target)
            {
              console.log(options.target);
                //console.log(options.target);
              for (var i=0; i<NUM_AGENTS; i++) {
                if(revealed[i] == 1)
                {
                  continue;
                }
                pos = simulator.getAgentPosition(i);
                dist = Math.sqrt(Math.pow((x-w/2)-pos.x,2) + Math.pow((y-h/2)-pos.y,2));

                if(dist <= simulator.getAgentRadius(i))
                {
                  canvas.remove(canvas.getItemByName(`circle_${i}`));
                  revealed[i] = 1;
                  canvas.remove(canvas.findTarget(options.target));
                  clicks.push([i,options.target.name]);
                  console.log(clicks);
                  break;
                }
              }

              if(clicks.length == NUM_AGENTS)
              {
                board.draw(simulator);
                var text = new fabric.Text(`${question_type==1 ? "Experiment" : "Practice "} ${question_type==1 ? question-practice_questions:question}/${question_type==1 ? experimental_questions : practice_questions} complete in ${clicks.length} clicks! Click to continue...`, { left: w/2, top: image_size/2,fontSize:3*font/4, textAlign: 'center' ,selectable:false});
                canvas.add(text);
                testFlag = 2;
              }
            }
          }

          if(testFlag == 2)
          {
            MTurkForm.append(`<input type='hidden' name=${question}_clicks value=${clicks.join(',')}/>`);
            MTurkForm.append(`<input type='hidden' name=${question}_agents value=${agent_coords.join(',')}/>`);
            MTurkForm.append(`<input type='hidden' name=${question}_type value=${question_type}/>`);

            if(assignmentID != "ASSIGNMENT_ID_NOT_AVAILABLE")
              question++;
            if(question > practice_questions+experimental_questions)
              MTurkForm.submit();
            testFlag = 0;
            canvas.clear();
            run();
          }
        });
        run();
      }
      startFlag++;
    }
  });
});
