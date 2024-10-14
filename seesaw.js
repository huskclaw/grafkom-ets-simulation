import { fragmentShaderSource, vertexShaderSource } from './shaders.js';

let seesaw, leftWeight, rightWeight;
let seesawRunning = false;
let animationFrameId;
let seesawProgram;
let gl, canvas;
let positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation;

// Basic rectangle vertices for rendering the seesaw and weights
const rectangleVertices = new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
     0.5,  0.5,
    -0.5,  0.5
]);

class Seesaw {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;  // Initial angle for balance
        this.width = 300;    // Seesaw board width (scaling factor will be applied)
        this.height = 10;    // Seesaw board thickness (scaling factor will be applied)
        this.scale = 1.0;    // Overall scale, applied as float
        this.color = [0, 1, 0, 1];
    }

    draw() {
        // console.log('Drawing seesaw at:', this.x, this.y, ' with scale:', this.scale, 'and angle:', this.angle);
        gl.bufferData(gl.ARRAY_BUFFER, rectangleVertices, gl.STATIC_DRAW);
        gl.uniform2f(translationUniformLocation, this.x, this.y);  // Position
        gl.uniform1f(rotationUniformLocation, this.angle);         // Rotation (seesaw angle)
        gl.uniform1f(scaleUniformLocation, this.scale);            // Scale
        gl.uniform4fv(colorUniformLocation, this.color);           // Color (for weights and seesaw)

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

class Weight {
    constructor(x, distance, mass, color) {
        this.x = x;
        this.y = 0;  // Initialize y position
        this.distance = distance;  // Distance from the pivot
        this.mass = mass;
        this.size = 20;  // Size of the weight (scaling factor will be applied)
        this.color = color;
        this.scale = 1.0;  // Overall scale for the weight
    }

    update(yOffset) {
        this.y = yOffset;  // Update position based on seesaw angle
    }

    draw() {
        // console.log('Drawing weight at:', this.x, this.y, ' with scale:', this.scale);
        gl.bufferData(gl.ARRAY_BUFFER, rectangleVertices, gl.STATIC_DRAW);
        gl.uniform2f(translationUniformLocation, this.x, this.y);  // u_translation is vec2
        gl.uniform1f(rotationUniformLocation, 0);                 // u_rotation is float
        gl.uniform1f(scaleUniformLocation, this.scale);           // u_scale is float (applied uniformly to size)
        gl.uniform4fv(colorUniformLocation, this.color);          // u_color is vec4 (use uniform4fv)
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

export function initSeesawSimulation(newGL, newCanvas) {
    gl = newGL;
    canvas = newCanvas;

    // Initialize WebGL program
    seesawProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!seesawProgram) {
        console.error('Failed to create WebGL program');
        return;
    }
    gl.useProgram(seesawProgram);
    // console.log('Seesaw program initialized');

    // Set up buffers and attribute locations
    positionBuffer = gl.createBuffer();
    positionAttributeLocation = gl.getAttribLocation(seesawProgram, 'a_position');
    colorUniformLocation = gl.getUniformLocation(seesawProgram, 'u_color');
    translationUniformLocation = gl.getUniformLocation(seesawProgram, 'u_translation');
    rotationUniformLocation = gl.getUniformLocation(seesawProgram, 'u_rotation');
    scaleUniformLocation = gl.getUniformLocation(seesawProgram, 'u_scale');

    // Set up viewport and clear color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.5, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable the position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rectangleVertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Initialize the seesaw and weights
    seesaw = new Seesaw(canvas.width / 2, canvas.height / 2, 0);  // Centered, balanced
    leftWeight = new Weight(canvas.width / 2 - 100, 2, 10, [1.0, 0.0, 0.0, 1.0]);  // Red weight
    rightWeight = new Weight(canvas.width / 2 + 100, 2, 10, [0.0, 1.0, 0.0, 1.0]);  // Green weight

    renderSeesaw();  // Render initial state without animation
}

function applyPhysics() {
    const torqueLeft = leftWeight.mass * leftWeight.distance * 9.8;
    const torqueRight = rightWeight.mass * rightWeight.distance * 9.8;
    const netTorque = torqueRight - torqueLeft;

    // Adjust the seesaw angle based on net torque (simplified physics)
    seesaw.angle += netTorque * 0.0001;
    seesaw.angle = Math.max(Math.min(seesaw.angle, Math.PI / 4), -Math.PI / 4);  // Limit the angle
}

// function updateWeightPositions() {
//     const offsetY = Math.sin(seesaw.angle) * 40;  // Offset based on seesaw angle
//     leftWeight.update(offsetY);
//     rightWeight.update(-offsetY);
// }

function updateWeightPositions() {
    // Calculate vertical position based on the angle of the seesaw
    const seesawHeight = Math.sin(seesaw.angle) * 40;  // Adjust height based on seesaw angle
    leftWeight.update(seesaw.y + seesawHeight);         // Adjust left weight position
    rightWeight.update(seesaw.y - seesawHeight);        // Adjust right weight position
}


function renderSeesaw() {
    // console.log('Rendering seesaw');
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(seesawProgram);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    seesaw.draw();  // Draw seesaw board
    updateWeightPositions();
    leftWeight.draw();  // Draw left weight
    rightWeight.draw();  // Draw right weight

    if (seesawRunning) {
        applyPhysics();
        animationFrameId = requestAnimationFrame(renderSeesaw);
    }
}

export function startSeesawSimulation() {
    if (!seesawRunning) {
        seesawRunning = true;
        // console.log('Starting seesaw simulation');
        renderSeesaw();
    }
}

export function stopSeesawSimulation() {
    seesawRunning = false;
    // console.log('Stopping seesaw simulation');
    cancelAnimationFrame(animationFrameId);  // Stop the animation
}

export function resetSeesawSimulation() {
    stopSeesawSimulation();
    seesaw.angle = 0;  // Reset to balanced position
    // console.log('Resetting seesaw simulation');
    renderSeesaw();  // Render the reset state
}

export function updateMasses(leftMass, rightMass) {
    leftWeight.mass = leftMass;
    rightWeight.mass = rightMass;
    // console.log('Updating masses:', leftMass, rightMass);
    if (!seesawRunning) renderSeesaw();  // Update rendering if simulation is not running
}

export function updateDistances(leftDistance, rightDistance) {
    leftWeight.distance = leftDistance;
    rightWeight.distance = rightDistance;
    // console.log('Updating distances:', leftDistance, rightDistance);
    if (!seesawRunning) renderSeesaw();  // Update rendering if simulation is not running
}

// Helper function to create a WebGL shader
function createShader(gl, type, source) {
    if (!source) {
        console.error("Shader source is undefined");
        return null;
    }

    // console.log("Compiling shader: ", source);  // Log the shader source for debugging
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Helper function to create a WebGL program
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Check if shaders were created successfully
       if (!vertexShader || !fragmentShader) {
        console.error('Failed to create vertex or fragment shader');
        return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}