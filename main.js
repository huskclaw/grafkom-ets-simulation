import { vertexShaderSource, fragmentShaderSource } from './shaders.js';
import { initializeAquarium, startAquariumSimulation, addFish, removeFish, stopAquariumSimulation } from './aquarium.js';
import { initPhysicsSimulation, startPhysicsSimulation, stopPhysicsSimulation, resetPhysicsSimulation } from './physics.js';
import { initFusionSimulation, startFusionSimulation, stopFusionSimulation, updateFusionSimulation } from './fusion.js';

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

// const program = gl.createProgram();
// gl.attachShader(program, vertexShader);
// gl.attachShader(program, fragmentShader);
// gl.linkProgram(program);

// if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//     console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
// }

const aquariumProgram = gl.createProgram();
gl.attachShader(aquariumProgram, vertexShader);
gl.attachShader(aquariumProgram, fragmentShader);
gl.linkProgram(aquariumProgram);

if (!gl.getProgramParameter(aquariumProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(aquariumProgram));
}



initializeAquarium(gl, aquariumProgram);
// gl.useProgram(program);

// const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
const resolutionUniformLocation = gl.getUniformLocation(aquariumProgram, 'u_resolution');
// const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
// const translationUniformLocation = gl.getUniformLocation(program, 'u_translation');
// const rotationUniformLocation = gl.getUniformLocation(program, 'u_rotation');
// const scaleUniformLocation = gl.getUniformLocation(program, 'u_scale');

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

// Add event listeners for fusion controls
// document.getElementById('controlRod').addEventListener('input', (e) => {
//     document.getElementById('controlRodValue').textContent = `${e.target.value}%`;
//     updateFusionSimulation();
// });

// document.getElementById('cooling').addEventListener('input', (e) => {
//     document.getElementById('coolingValue').textContent = `${e.target.value}%`;
//     updateFusionSimulation();
// });

// document.getElementById('startFusion').addEventListener('click', () => startFusionSimulation(gl, canvas));
// document.getElementById('stopFusion').addEventListener('click', stopFusionSimulation);


document.getElementById('startFusion').addEventListener('click', () => startFusionSimulation(gl, canvas));
document.getElementById('stopFusion').addEventListener('click', stopFusionSimulation);

document.getElementById('controlRod').addEventListener('input', updateFusionSimulation);
document.getElementById('cooling').addEventListener('input', updateFusionSimulation);


// Start with the aquarium simulation by default
startAquariumSimulation(gl, canvas, positionBuffer);

// function switchSimulation() {
//     const simulationType = document.getElementById('simulationSelect').value;
//     if (simulationType === 'aquarium') {
//         document.getElementById('aquariumControls').style.display = 'block';
//         document.getElementById('physicsControls').style.display = 'none';
//         startAquariumSimulation(gl, canvas, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation);
//     } else {
//         document.getElementById('aquariumControls').style.display = 'none';
//         document.getElementById('physicsControls').style.display = 'block';
//         startPhysicsSimulation(gl, canvas);
//     }
// }

function switchSimulation() {
    const simulationType = document.getElementById('simulationSelect').value;

    document.getElementById('aquariumControls').style.display = 'none';
    document.getElementById('physicsControls').style.display = 'none';
    document.getElementById('fusionControls').style.display = 'none';

    if (typeof stopAquariumSimulation === 'function') stopAquariumSimulation();
    if (typeof stopPhysicsSimulation === 'function') stopPhysicsSimulation();
    if (typeof stopFusionSimulation === 'function') stopFusionSimulation();

    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (simulationType === 'aquarium') {
        document.getElementById('aquariumControls').style.display = 'block';
        initializeAquarium(gl, aquariumProgram);
        startAquariumSimulation(gl, canvas, positionBuffer);
        
    } else if (simulationType === 'physics') {
        document.getElementById('physicsControls').style.display = 'block';
        initPhysicsSimulation(gl, canvas);
    } else if (simulationType === 'fusion') {
        document.getElementById('fusionControls').style.display = 'block';
        initFusionSimulation(gl, canvas);
    }
}

