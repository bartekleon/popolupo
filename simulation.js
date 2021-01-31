const simulator = new Simulator();
const tracy = new Tracy(0, 10, 3);
simulator.addTracy(tracy);
simulator.addBlock(3, 0, 3, 2, 2, 2, 2);
simulator.addBlock(-3, 0, 3, 2, 2, 2, 2);
simulator.addRamp(10, 30, -25);

// 35, -35

let stepper = 0;

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
  const proximity = tracy.getProximitySensorReading();
  const rotation = tracy.getMagnetometerReading(); // change only Z

  const requiredRotation = Math.atan2(y2 - y1, x2 - x1);
  rotateTracyToFaceTarget(requiredRotation, x2, y2);

  // tracy.setMotorSpeeds(right, left) // force in N
  // tract.stop() // tract.setMotorSpeeds(0, 0); // applies 10N breaking force

  console.log('pos', x1, y1);
  console.log('pos2', x2, y2);
  console.log(requiredRotation);
  console.log('prox', proximity);
}

function rotateTracyToFaceTarget(requiredRotation, x2, y2) {
  stepper = 1;
  tracy.setMotorSpeeds(20, -20);
  const int = window.setInterval(() => {
    const rotation = tracy.orientation;
    if(Math.abs((rotation.z / 180 * Math.PI) % Math.PI + requiredRotation) < 0.01) {
      tracy.setMotorSpeeds(0, 0);
      stepper = 2;
      window.clearInterval(int);
      moveTracyTowardsTarget(x2, y2);
    }
  }, 20);
}

function moveTracyTowardsTarget(targetX, targetY) {
  tracy.setMotorSpeeds(200, 200);
  const int = window.setInterval(() => {
    const position = simulator.getTracyPosition();
    const x1 = position.x;
    const y1 = position.y;
    console.log((x1 - targetX) ** 2 + (y1 - targetY) ** 2, (x1 - targetX), (y1 - targetY))
    if((x1 - targetX) ** 2 + (y1 - targetY) ** 2 < 10) {
      console.log('hello?');
      tracy.setMotorSpeeds(0, 0);
      window.clearInterval(int);
    }
  }, 30);
}

// example: 4, -30
window.setTimeout(() => {
  goto(4, 30);
  simulator.addBlock(4, 30, 3, 1, 1, 1, 1);
}, 3000);

console.log(tracy);