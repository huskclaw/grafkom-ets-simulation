import { fragmentShaderSource, vertexShaderSource } from './shaders.js';

let seesaw, leftWeight, rightWeight;
let seesawRunning = false;
let animationFrameId;
let seesawProgram;
let gl, canvas;
let positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation, resolutionUniformLocation;

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
        this.angle = angle;
        this.width = 300;
        this.height = 10;
        this.scale = 1.0;
        this.color = [0.5, 0.35, 0.05, 1]; // Brown color for seesaw
    }

    draw() {
        gl.uniform2f(translationUniformLocation, this.x, this.y);
        gl.uniform1f(rotationUniformLocation, this.angle);
        gl.uniform1f(scaleUniformLocation, this.width);
        gl.uniform4fv(colorUniformLocation, this.color);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

class Weight {
    constructor(x, distance, mass, color) {
        this.x = x;
        this.y = 0;
        this.distance = distance;
        this.mass = mass;
        this.size = 40;
        this.color = color;
        this.scale = 1.0;
    }

    update(yOffset) {
        this.y = yOffset;
    }

    draw() {
        gl.uniform2f(translationUniformLocation, this.x, this.y);
        gl.uniform1f(rotationUniformLocation, 0);
        gl.uniform1f(scaleUniformLocation, this.size);
        gl.uniform4fv(colorUniformLocation, this.color);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

export function initSeesawSimulation(newGL, newCanvas) {
    gl = newGL;
    canvas = newCanvas;

    seesawProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!seesawProgram) {
        console.error('Failed to create WebGL program');
        return;
    }
    gl.useProgram(seesawProgram);

    positionBuffer = gl.createBuffer();
    positionAttributeLocation = gl.getAttribLocation(seesawProgram, 'a_position');
    colorUniformLocation = gl.getUniformLocation(seesawProgram, 'u_color');
    translationUniformLocation = gl.getUniformLocation(seesawProgram, 'u_translation');
    rotationUniformLocation = gl.getUniformLocation(seesawProgram, 'u_rotation');
    scaleUniformLocation = gl.getUniformLocation(seesawProgram, 'u_scale');
    resolutionUniformLocation = gl.getUniformLocation(seesawProgram, 'u_resolution');

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rectangleVertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    seesaw = new Seesaw(canvas.width / 2, canvas.height / 2, 0);
    leftWeight = new Weight(canvas.width / 2 - 100, 100, 10, [1.0, 0.0, 0.0, 1.0]);
    rightWeight = new Weight(canvas.width / 2 + 100, 100, 10, [0.0, 0.0, 1.0, 1.0]);

    renderSeesaw();
}

function applyPhysics() {
    const torqueLeft = leftWeight.mass * leftWeight.distance * 9.8;
    const torqueRight = rightWeight.mass * rightWeight.distance * 9.8;
    const netTorque = torqueRight - torqueLeft;

    seesaw.angle += netTorque * 0.0001;
    seesaw.angle = Math.max(Math.min(seesaw.angle, Math.PI / 4), -Math.PI / 4);
}

function updateWeightPositions() {
    const seesawHeight = Math.sin(seesaw.angle) * seesaw.width / 2;
    leftWeight.update(seesaw.y - seesawHeight);
    rightWeight.update(seesaw.y + seesawHeight);
}

function renderSeesaw() {
    gl.clearColor(0.1, 0.5, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(seesawProgram);

    seesaw.draw();
    updateWeightPositions();
    leftWeight.draw();
    rightWeight.draw();

    if (seesawRunning) {
        applyPhysics();
        animationFrameId = requestAnimationFrame(renderSeesaw);
    }
}

export function startSeesawSimulation() {
    if (!seesawRunning) {
        seesawRunning = true;
        renderSeesaw();
    }
}

export function stopSeesawSimulation() {
    seesawRunning = false;
    cancelAnimationFrame(animationFrameId);
}

export function resetSeesawSimulation() {
    stopSeesawSimulation();
    seesaw.angle = 0;
    renderSeesaw();
}

export function updateMasses(leftMass, rightMass) {
    leftWeight.mass = leftMass;
    rightWeight.mass = rightMass;
    if (!seesawRunning) renderSeesaw();
}

export function updateDistances(leftDistance, rightDistance) {
    leftWeight.distance = leftDistance;
    rightWeight.distance = rightDistance;
    if (!seesawRunning) renderSeesaw();
}

function createShader(gl, type, source) {
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

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

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