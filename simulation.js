const simulator = new Simulator();
const tracy = new Tracy(0, 10, 3);
simulator.addTracy(tracy);
simulator.addBlock(3, 0, 3, 2, 2, 2, 2);
simulator.addBlock(-3, 0, 3, 2, 2, 2, 2);
simulator.addRamp(35, -15, -25);

// 35, -35

let stepper = 0;

let oldDist = null;

function isObstacleAhead() {
  const proximity = tracy.getProximitySensorReading();
  
  return proximity.front < 8 && proximity.front !== 0;
}

function isObstacleOnTheSide() {
  const proximity = tracy.getProximitySensorReading();
  
  return proximity.right < 10 && proximity.right !== 0 || proximity.left < 10 && proximity.left !== 0;
}

const maxSpeed = 0.6;
const maxRotation = 15;
const interval = 500;

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
  rotateTracyToFaceTarget(x2, y2);
}

function rotateTracyToFaceTarget(x2, y2, end = false) {
  console.log('rotating towards');

  tracy.setMotorSpeeds(maxRotation, -maxRotation);
  const int = window.setInterval(() => {
    const position = simulator.getTracyPosition();
    const x1 = position.x;
    const y1 = position.y;
  
    let requiredRotation = Math.atan2(y2 - y1, x2 - x1);
    const rotation = tracy.orientation;
    tracy.orientation.z = rotation.z % 360;
    if(requiredRotation < -Math.PI / 2) {
      requiredRotation += Math.PI;
      requiredRotation = -requiredRotation;
    } else if(requiredRotation > Math.PI / 2) {
      requiredRotation -= Math.PI;
      requiredRotation = -requiredRotation;
    }
    const required = Math.abs((rotation.z / 180 * Math.PI) % Math.PI + requiredRotation);
    if(required < (end ? 0.0075 : 0.02)) {
      window.clearInterval(int);
      tracy.setMotorSpeeds(0, 0);
      window.setTimeout(() => {
        moveTracyTowardsTarget(x2, y2, end);
      }, interval);
    }
  }, end ? 5 : 20);
}

function moveTracyTowardsTarget(targetX, targetY, end) {
  console.log('moving towards');
  tracy.setMotorSpeeds(maxSpeed, maxSpeed);
  const int = window.setInterval(() => {
    if(isObstacleAhead() && !end) {
      window.clearInterval(int);
      tracy.setMotorSpeeds(0, 0);
      window.setTimeout(() => {
        dodgeObstacle(targetX, targetY);
      }, interval);
    }
    const position = simulator.getTracyPosition();
    const x1 = position.x;
    const y1 = position.y;
    if((x1 - targetX) ** 2 + (y1 - targetY) ** 2 < 10) {
      tracy.setMotorSpeeds(500, 500);
      console.log('FINISHED');
      if(!end) {
        tracy.setMotorSpeeds(0, 0);
        window.clearInterval(int);
        window.setTimeout(() => {
          rotateTracyToFaceTarget(40, -15, true);
        }, 1500);
      }
    }
  }, 15);
}

function dodgeObstacle(targetX, targetY) {
  console.log('dodge');
  tracy.setMotorSpeeds(maxRotation, -maxRotation);

  const int = window.setInterval(() => {
    if(!isObstacleAhead()) {
      clearInterval(int);
      window.setTimeout(() => {
        tracy.setMotorSpeeds(0, 0);
      }, 150);
      window.setTimeout(() => {
        moveAlongObstacle(targetX, targetY);
      }, interval);
    }
  }, 10);
}

function moveAlongObstacle(x2, y2) {
  console.log('move along');
  tracy.setMotorSpeeds(maxSpeed, maxSpeed);
  const int = window.setInterval(() => {
    console.log(tracy.getProximitySensorReading());
    if(!isObstacleOnTheSide()) {
      clearInterval(int);
      tracy.setMotorSpeeds(-maxSpeed / 4, -maxSpeed / 4);
      window.setTimeout(() => {
        tracy.setMotorSpeeds(0, 0);
      }, interval);
      window.setTimeout(() => {
        rotateTracyToFaceTarget(x2, y2);
      }, interval * 2);
    }
  }, 20);
}

function start(targetX, targetY) {
  goto(targetX, targetY);
  simulator.addBlock(targetX, targetY, 3, 1, 1, 1, 1);
}

// example: 4, -30
window.setTimeout(() => {
  const targetX = 4;
  const targetY = -15;
  goto(targetX, targetY);
  // simulator.addBlock(targetX, targetY, 3, 1, 1, 1, 1);
}, 3000);
