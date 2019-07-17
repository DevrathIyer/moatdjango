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
var locked = false;

//SANDBOX URL
var URL = "https://workersandbox.mturk.com/mturk/externalSubmit";

//REAL URL
//var URL = "https://www.mturk.com/mturk/externalSubmit";

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
  //console.log(w);
  image_size = style_width * dpi/35;
  font = parseInt(style_width * dpi/35,10);
}


var Board = function() {
  fix_dpi();
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');

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

    if(i == 0)
    {
      velocity = RVOMath.normalize (simulator.getGoal(i).minus(simulator.getAgentPosition(i)));
      console.log(Math.sqrt(Math.pow(velocity.x,2) + Math.pow(velocity.y,2)));
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
  var radius = image_size/2+image_size/10; // TODO validate
  simulator.setAgentDefaults(
      radius*radius, // neighbor distance (min = radius * radius)
      30, // max neighbors
      600, // time horizon
      600, // time horizon obstacles
      radius, // agent radius
      dpi/2, // max speed
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
  canvas = new fabric.Canvas('board',{selectable:false});
  canvas.setZoom(1/dpi);

  var text = new fabric.Text('Click on the', { left: w/2-3*image_size, top: image_size/2,fontSize:3*font/4,selectable:false, textAlign: 'right',font:'Arial' ,selectable:false});
  canvas.add(text);

  var imgInstance = new fabric.Image(imgs[target], {
    left: w/2+image_size,
    top: image_size/2,
    selectable:false,
    scaleX:image_size/500,
    scaleY:image_size/500
  });
  canvas.add(imgInstance);

  canvas.on('mouse:up', function(e)
  {
    if(!e.target.name.includes('agent'))
    {
      var r = /\d+/;
      click = e.target.name.match(r);
      clicks.push(click);
      if(click == target)
      {
        reset();
      }
      else
      {
        var pos = simulator.getAgentPosition(click);
        canvas.remove(e.target);
        var imgInstance = new fabric.Image(imgs[click], {
          left: pos.x + w/2 - image_size/2,
          top: pos.y + h/2 - image_size/2,
          selectable:false,
          hasControls:false,
          hasBorders:false,
          hasRotatingPoint:false,
          scaleX:image_size/500,
          scaleY:image_size/500,
          name:'agent_${click}'
        });
        canvas.add(imgInstance);
      }
    }
  });
  for (var i=0; i<NUM_AGENTS; i++) {
    var pos = simulator.getAgentPosition(i);
    radius = simulator.getAgentRadius(i);
    agent_coords.push([pos.x,pos.y]);
    var circle = new fabric.Circle({radius: 5*radius/4, fill: 'red', stroke: 'white', strokeWidth: image_size/10, left: pos.x + w/2-3*image_size/4, selectable:false,top: pos.y + h/2-3*image_size/4,name:`circle_${i}`});
      canvas.add(circle)
  }

  testFlag = 1;
}

var reset = function()
{
  wrapper = document.getElementById('cwrapper');
  wrapper.innerHTML = "<canvas id='board'>Your browser does not support canvas.  Please use a modern browser with HTML5 support.</canvas>";
  board = new Board();
  canvas = null;
  $('#board').click(function(e){
    var x = e.clientX
      , y = e.clientY;
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
      run();
    }
  });
  board.draw(simulator);
  canvas =  document.getElementById('board');
  ctx = canvas.getContext('2d');
  ctx.fillStyle = "black";
  ctx.font = `${3*font/4}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(`${question_type==1 ? "Experiment" : "Practice "} ${question_type==1 ? question-practice_questions:question}/${question_type==1 ? experimental_questions : practice_questions} complete in ${clicks.length} clicks! Click to continue...`,w/2,image_size);
  canvas = null;
  testFlag=2;
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
    if(dpi > 1)
    {
      ctx.fillStyle = "black";
      ctx.font = `${3*font/4}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("At this time, the MOA experiment does not support your current screen resolution.", w/2, h/2 -(font/2));
      ctx.fillText("Please return the HIT. We apologize for the inconvinience.",w/2, h/2 + (font/2));
      locked = true;
    }
    else {
    ctx.fillStyle = "black";
    ctx.font = `${font}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("READ CAREFULLY BEFORE ACCEPTING HIT:", w/2, h/20);

    ctx.font = `${font/2}px Arial`;
    ctx.textAlign = "left";
    ctx.fillText("This study is part of a research project titled 'Multiple Object Awareness'. The principal investigator in charge of this study is Jeremy Wolfe.", w/20 , 2*h/20);
    ctx.fillText("However, other research staff may be involved and can act on behalf of the person in charge.", w/20, 3*h/20);

    ctx.font = `${3*font/4}px Arial`;
    ctx.fillText("Requirements:", w/20, 5*h/20);
    ctx.font = `${font/2}px Arial`;
    ctx.fillText("You need normal vision for this task.", w/20, 6*h/20);

    ctx.font = `${3*font/4}px Arial`;
    ctx.fillText("Instructions:", w/20, 8*h/20);
    ctx.font = `${font/2}px Arial`;
    ctx.fillText("A group of animals will appear on screen. When you are ready, click anywhere and they will begin to move.", w/20, 9*h/20);
    ctx.fillText("Try to keep track of their locations to the best of your ability.",w/20, 10*h/20);
    ctx.fillText("After a few seconds, the animals will freeze and be covered up. You will be asked to click on a target animal.",w/20, 11*h/20);
    ctx.fillText("Keep clicking until you find the target. Try to click as few times as possible.",w/20, 12*h/20);

    ctx.fillText(`There are ${practice_questions+experimental_questions} questions(${practice_questions} practice, ${experimental_questions} experimental), which you should be able to complete in ${(practice_questions+experimental_questions)} minutes. You are alloted ${(3/2)*(practice_questions+experimental_questions)} minutes.`,w/20, 14*h/20);
    ctx.fillText("Please maximize your browser. If you must do so now, please reload the page. Do not resize the browser during the experiment.", w/20, 15*h/20);
    ctx.fillText("By participating in this study, you will be part of the scientific effort to understand the functioning of the human visual system.", w/20, 16*h/20);
    ctx.fillText("You will receive $8 for your participation. You will be compensated only if you complete all the questions and adequately answer them.", w/20, 17*h/20);
    ctx.textAlign = "center";
    ctx.fillText("BY ACCEPTING THIS HIT, YOU ACKNOWLEDGE THAT YOU READ THE CONSENT FORM,", w/2, 18*h/20);
    ctx.fillText("UNDERSTAND THE INFORMATION AND YOU CONSENT TO PARTICIPATE IN THIS STUDY.", w/2, 19*h/20);
    startFlag++;
  }
  }


  //handles clicking on canvas
  $('#board').click(function(e){
    var x = e.clientX
      , y = e.clientY;
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
      run();
    }
    else if(testFlag == -1 && !locked)
    {
      board.reset();
      fix_dpi();
      ctx.fillStyle = "black";
      ctx.font = `${font}px Arial`;
      ctx.textAlign = "center";
      if(startFlag == 1)
      {
        run();
      }
      startFlag++;
    }
  });
});
