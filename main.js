import { vertexShaderSource, fragmentShaderSource } from './shaders.js';
import { initializeAquarium, startAquariumSimulation, addFish, removeFish, stopAquariumSimulation } from './aquarium.js';
import { initPhysicsSimulation, startPhysicsSimulation, stopPhysicsSimulation, resetPhysicsSimulation } from './physics.js';
import { initSeesawSimulation, startSeesawSimulation, resetSeesawSimulation, updateMasses, updateDistances, stopSeesawSimulation } from './seesaw.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');


if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
}

// WebGL shader setup
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const aquariumProgram = gl.createProgram();
gl.attachShader(aquariumProgram, vertexShader);
gl.attachShader(aquariumProgram, fragmentShader);
gl.linkProgram(aquariumProgram);

if (!gl.getProgramParameter(aquariumProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(aquariumProgram));
}



initializeAquarium(gl, aquariumProgram);
const resolutionUniformLocation = gl.getUniformLocation(aquariumProgram, 'u_resolution');

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0.1, 0.5, 0.9, 1.0);

gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

// Event handling and simulation switching
document.getElementById('simulationSelect').addEventListener('change', switchSimulation);
document.getElementById('enablePlayerFish').addEventListener('change', () => {
    if (document.getElementById('simulationSelect').value === 'aquarium') {
        startAquariumSimulation(gl, canvas, positionBuffer);
    }
});

// Aquarium simulation controls
document.getElementById('addFish').addEventListener('click', () => addFish(canvas));
document.getElementById('removeFish').addEventListener('click', removeFish);

// Physics simulation controls
document.getElementById('startPhysics').addEventListener('click', startPhysicsSimulation);
document.getElementById('stopPhysics').addEventListener('click', stopPhysicsSimulation);
document.getElementById('resetPhysics').addEventListener('click', resetPhysicsSimulation);

// Seesaw simulation controls
document.getElementById('simulationSelect').addEventListener('change', switchSimulation);
document.getElementById('leftMass').addEventListener('input', updateSeesawMasses);
document.getElementById('rightMass').addEventListener('input', updateSeesawMasses);
document.getElementById('leftDistance').addEventListener('input', updateSeesawDistances);
document.getElementById('rightDistance').addEventListener('input', updateSeesawDistances);
document.getElementById('startSeesaw').addEventListener('click', startSeesawSimulation);
document.getElementById('resetSeesaw').addEventListener('click', resetSeesawSimulation);

// Seesaw-specific logic
function updateSeesawMasses() {
    const leftMass = parseFloat(document.getElementById('leftMass').value);
    const rightMass = parseFloat(document.getElementById('rightMass').value);
    updateMasses(leftMass, rightMass);
}

function updateSeesawDistances() {
    const leftDistance = parseFloat(document.getElementById('leftDistance').value);
    const rightDistance = parseFloat(document.getElementById('rightDistance').value);
    updateDistances(leftDistance, rightDistance);
}

// Start with the aquarium simulation by default
startAquariumSimulation(gl, canvas, positionBuffer);

function switchSimulation() {
    const simulationType = document.getElementById('simulationSelect').value;

    document.getElementById('aquariumControls').style.display = 'none';
    document.getElementById('physicsControls').style.display = 'none';
    document.getElementById('seesawControls').style.display = 'none';

    if (typeof stopAquariumSimulation === 'function') stopAquariumSimulation();
    if (typeof stopPhysicsSimulation === 'function') stopPhysicsSimulation();
    if (typeof stopSeesawSimulation === 'function') stopSeesawSimulation();

    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (simulationType === 'aquarium') {
        document.getElementById('aquariumControls').style.display = 'block';
        initializeAquarium(gl, aquariumProgram);
        startAquariumSimulation(gl, canvas, positionBuffer);
        
    } else if (simulationType === 'physics') {
        document.getElementById('physicsControls').style.display = 'block';
        initPhysicsSimulation(gl, canvas);

    } else if (simulationType === 'seesaw') {
        document.getElementById('seesawControls').style.display = 'block';
        initSeesawSimulation(gl, canvas);
        startSeesawSimulation();
    }
}