const simulator = new Simulator();
const tracy = new Tracy(0, 10, 3);
simulator.addTracy(tracy);
simulator.addBlock(3, 0, 3, 2, 2, 2, 2);
simulator.addBlock(-3, 0, 3, 2, 2, 2, 2);
simulator.addRamp(10, 30, -25);

// 35, -35

let stepper = 0;

let oldDist = null;

function isObstacleAhead() {
  const proximity = tracy.getProximitySensorReading();
  
  return proximity.front < 8 && proximity.front !== 0;
}

function isObstacleOnTheSide() {
  const proximity = tracy.getProximitySensorReading();
  
  return proximity.right < 8 && proximity.right !== 0 || proximity.left < 8 && proximity.left !== 0;
}

const maxSpeed = 2;
const maxRotation = 10;
const interval = 30;

let last = 0;
let step = 0;
let stoppingForce = 0;
let isBraking = false;

/**
 * Algorithm how to get from A to B:
 * 1. Change rotation to face B
 * 2. Move towards
 * 2.1. If front sensor < 8 && front sensor != 0 rotate so front = 0 and left/right != 0
 * 2.2. Move until left/right sensor = 0
 * 2.3. GOTO 1
 * 3. You have arrived
 */
function goto(x2, y2) {
  const position = simulator.getTracyPosition();
  const x1 = position.x;
  const y1 = position.y;
  const requiredRotation = Math.atan2(y2 - y1, x2 - x1);
  const currentRotation = (tracy.orientation.z / 180 * Math.PI) % Math.PI;
  const currentDist = (x1 - x2) ** 2 + (y1 - y2) ** 2;

  const lookingAtTheTarget = Math.abs(currentRotation + requiredRotation) < 0.02;

  function rotate() {
    if(last === 1 && stoppingForce > 0) {
      isBraking = true;
      stoppingForce -= 1;
      tracy.setMotorSpeeds(0, 0);
    } else {
      isBraking = false;
      last = 2;
      step = maxRotation;
      console.log("yes. im rotating");
      tracy.setMotorSpeeds(maxRotation, -maxRotation);
    }
  }

  function move() {
    if(last === 2 && step > 0) {
      tracy.setMotorSpeeds(0, 0);
      step -= 4;
    } else {
      console.log('yes im moving')
      last = 1;
      stoppingForce = 20;
      tracy.setMotorSpeeds(maxSpeed, maxSpeed);
    }
  }
  if(currentDist < 10) { // FINISHED
    console.log("FINISHED!!!");
    tracy.setMotorSpeeds(0, 0);
  } else if(!isBraking && isObstacleAhead()) { // obstacle
    console.log('dodging');
    rotate();
  } else if(!lookingAtTheTarget && !isObstacleOnTheSide()) {
    console.log('rotating towards the target');
    rotate();
  } else {
    console.log('moving towards the target');
    move();
  } 
}



// example: 4, -30
window.setTimeout(() => {
  const targetX = 4;
  const targetY = -15;
  window.setInterval(() => {

    goto(targetX, targetY);
  }, interval);
  simulator.addBlock(targetX, targetY, 3, 1, 1, 1, 1);
}, 3000);

console.log(tracy);