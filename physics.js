import { fragmentShaderSource, vertexShaderSource } from './shaders.js';  // Use imported shaders

let square1, square2;
let physicsRunning = false;
let animationFrameId;
let program;  // WebGL program to hold the shaders
let gl, canvas;
let positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, scaleUniformLocation;


const squareVertices = new Float32Array([
    -0.5, -0.5,
    0.5, -0.5,
    0.5, 0.5,
    -0.5, 0.5
]);

class Square {
    constructor(x, y, mass, isMoving, canvas) {
        this.initialX = x;
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.initialVelocity = isMoving ? -2 : 0;
        this.velocity = isMoving ? -2 : 0;  // Initial velocity for moving square
        this.color = isMoving ? [0, 1, 0, 1] : [1, 0, 0, 1];  // Green for moving, Red for still
        this.size = 50;  // Size of the square
        this.canvas = canvas;
    }

    update() {
        this.x += this.velocity;

        // Bounce off walls without friction
        if (this.x - this.size / 2 < 0 || this.x + this.size / 2 > this.canvas.width) {
            this.velocity *= -1;  // Reverse velocity
        }
    }

    draw() {
        console.log('Drawing seesaw at:', this.x, this.y, ' with scale:', this.scale, 'and angle:', this.angle);
        gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
        gl.uniform4fv(colorUniformLocation, this.color);
        gl.uniform2f(translationUniformLocation, this.x, this.canvas.height / 2);
        gl.uniform1f(scaleUniformLocation, this.size);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    reset() {
        this.x = this.initialX;
        this.velocity = this.initialVelocity;
    }
}

// Helper function to create and link a WebGL program
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
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

// Helper function to create a shader
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

// Initialize the physics simulation with two squares
export function initPhysicsSimulation(newGL, newCanvas) {
    gl = newGL;
    canvas = newCanvas
    updateSquares();

    program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    positionBuffer = gl.createBuffer();
    positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    translationUniformLocation = gl.getUniformLocation(program, 'u_translation');
    scaleUniformLocation = gl.getUniformLocation(program, 'u_scale');

    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);

    renderPhysics(); // Render initial state without starting animation
}

function updateSquares() {
    const mass1 = parseFloat(document.getElementById('mass1').value);
    const mass2 = parseFloat(document.getElementById('mass2').value);
    
    if (!square1 || !square2) {
        square1 = new Square(200, canvas.height / 2, mass1, false, canvas);
        square2 = new Square(600, canvas.height / 2, mass2, true, canvas);
    } else {
        square1.mass = mass1;
        square2.mass = mass2;
    }
}

// Handle square collisions
function handleCollision() {
    if (Math.abs(square1.x - square2.x) <= square1.size) {
        // Perfectly elastic collision
        const v1 = square1.velocity;
        const v2 = square2.velocity;
        const m1 = square1.mass;
        const m2 = square2.mass;

        square1.velocity = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
        square2.velocity = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
    }
}

// Render the physics simulation
function renderPhysics() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    square1.update();  
    square2.update();  

    handleCollision();

    square1.draw();
    square2.draw();

    if (physicsRunning) {
        animationFrameId = requestAnimationFrame(() => renderPhysics(gl, canvas, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, scaleUniformLocation));
    }
}

// Start the physics simulation
export function startPhysicsSimulation(gl, canvas) {
    if (!physicsRunning) {
        physicsRunning = true;
        updateSquares();
        renderPhysics();
    }
}

// Stop the physics simulation
export function stopPhysicsSimulation() {
    physicsRunning = false;
    cancelAnimationFrame(animationFrameId);  // Stop the simulation
}

// Reset and restart the physics simulation
export function resetPhysicsSimulation(gl, canvas) {
    stopPhysicsSimulation();  // Stop the current simulation
    updateSquares();
    square1.reset();
    square2.reset();
    renderPhysics(); // Render the reset state
}
