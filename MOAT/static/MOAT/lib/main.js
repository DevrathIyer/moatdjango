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

//get drawing variables
var canvas = document.getElementById('board');
var ctx = canvas.getContext('2d');
var w = canvas.width;
var h = canvas.height;

//get DPI
dpi = window.devicePixelRatio;

function fix_dpi() {
//get CSS height
//the + prefix casts it to an integer
//the slice method gets rid of "px"
let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
//get CSS width
let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
//scale the canvas
canvas.setAttribute('height', style_height * dpi);
canvas.setAttribute('width', style_width * dpi);
image_size = style_width * dpi/30;
font = parseInt(style_width * dpi/35,10);
}


var Board = function() {
  fix_dpi();
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');

  var w = canvas.width;
  var h = canvas.height;

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
  };

  this.drawAgents = function(simulator) {
    for (var i=0; i<NUM_AGENTS; i++) {

      var pos = simulator.getAgentPosition(i);
      var radius = simulator.getAgentRadius(i);
      ctx.drawImage(imgs[i], pos.x+w/2-image_size/2,pos.y+h/2-image_size/2,image_size, image_size);
    }
  };

  this.draw = function(simulator) {
    fix_dpi();
    this.reset();
    this.drawObstacles(simulator);
    this.drawAgents(simulator);
  }

  this.reset = function() {
    ctx.clearRect(0,0,w,h);
  }
}

var setPreferredVelocities = function(simulator) {
  fix_dpi();
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;

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
  fix_dpi();
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;

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

  target = Math.floor(Math.random() * (NUM_AGENTS-1));
  console.log(target);
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
        //get drawing variables
        var canvas = document.getElementById('board');
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        ctx.fillStyle = "black";
        ctx.font = `${font}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText("The test will begin when you click.",w/2, h/2);
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
  //get drawing variables
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;


  for (var i=0; i<NUM_AGENTS; i++) {
    ctx.fillStyle = "red";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;

    var pos = simulator.getAgentPosition(i);
    agent_coords.push([pos.x,pos.y]);

    var radius = simulator.getAgentRadius(i);
    ctx.beginPath();
    ctx.arc(pos.x + w/2, pos.y + h/2, radius+5, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.stroke();
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "black";
  ctx.font = `${3*font/4}px Arial`;
  ctx.fillText("Click on the", w/2-image_size/4, 30);

  ctx.drawImage(imgs[target], w/2 + image_size/4,0,image_size, image_size);
  testFlag = 1;
}

$(document).ready(function() {
  //get MTurk Form from index.html and populate it with mturk data
  MTurkForm = $('#TurkForm');
  //MTurkForm.action = URL;
  //MTurkForm['assignmentId'] = assignmentID;
  //get drawing variables
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;

  //draw starting text
  if(testFlag == -1)
  {
    fix_dpi();
    ctx.fillStyle = "black";
    ctx.font = `${font}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("Welcome to the Multiple Object Awareness Test. Click to continue...", w/2, h/2);
    startFlag++;
  }


  //handles clicking on canvas
  $('#board').click(function(e){
    var x = e.clientX
      , y = e.clientY;

    //are we testing?
    if(testFlag == 1)
    {
      var revealed = new Array(NUM_AGENTS);
      for (var i=0; i<NUM_AGENTS; i++)
        revealed[i] = 0;

      for (var i=0; i<NUM_AGENTS; i++) {

        if(revealed[i] == 1)
        {
          continue;
        }
        pos = simulator.getAgentPosition(i);
        dist = Math.sqrt(Math.pow((x-w/2)-pos.x,2) + Math.pow((y-h/2)-pos.y,2));

        if(dist <= simulator.getAgentRadius(i))
        {
          clicks.push(i);
          if(target == i)
          {
            board.draw(simulator);
            ctx.fillStyle = "black";
            ctx.font = `${3*font/4}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(`${question_type==1 ? "Experiment" : "Practice "} ${question}/${question_type==1 ? experimental_questions : practice_questions} complete in ${clicks.length} clicks! Click to continue...`, w/2, 30);
            testFlag = 2;
          }
          else {
            //fix_dpi();
            ctx.fillStyle = "white";
            var radius = simulator.getAgentRadius(i)+6;
            ctx.beginPath();
            ctx.arc(pos.x + w/2, pos.y + h/2, radius, 0, Math.PI * 2, true);
            ctx.fill();

            ctx.drawImage(imgs[i], pos.x+w/2-image_size/2,pos.y+h/2-image_size/2,image_size, image_size);
          }
          break;
        }
      }
    }
    else if(testFlag == 2)
    {
      MTurkForm.append(`<input type='hidden' name=${question}_clicks value=clicks.join(',')/>`);
      MTurkForm.append(`<input type='hidden' name=${question}_agents value=agent_coords.join(',')/>`);
      MTurkForm.append(`<input type='hidden' name=${question}_type value=question_type/>`);

      if(assignmentID != "ASSIGNMENT_ID_NOT_AVAILABLE")
        question++;
      if(question > practice_questions+experimental_questions)
        MTurkForm.submit();
      testFlag = 0;
      run();
    }
    else if(testFlag == -1)
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
        ctx.fillText("After a few, the animals will freeze and be covered up.",w/2, h/2-(3*font/4));
        ctx.fillText("You will be asked to click on a target animal.",w/2, h/2+(3*font/4));
        ctx.fillText("Click to continue...", w/2, h/2 + (font+3*font/4));
      }
      if(startFlag == 3)
      {
        ctx.fillText("Keep clicking until you find the target.",w/2, h/2-(font));
        ctx.fillText("Try to click as few times as possible.",w/2, h/2);
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
        run();
      }
      startFlag++;
    }
  });
});
