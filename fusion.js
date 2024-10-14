import { vertexShaderSource, fragmentShaderSource } from './shaders.js';

let gl;
let program;
let particles = [];
let isRunning = false;
let temperature = 0;
let powerOutput = 0;
let reactionRate = 0;

const PARTICLE_COUNT = 500;
const NEUTRON_COUNT = 5;

function initFusionSimulation(glContext, canvas) {
    console.log("Initializing Fusion Simulation");
    gl = glContext;
    program = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // Initialize particles
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            type: i < NEUTRON_COUNT ? 'neutron' : 'fuel'
        });
    }

    console.log(`Created ${particles.length} particles`);

    // Set up constant attributes and uniforms
    setupAttributes();
}

function setupAttributes() {
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Store locations for later use
    program.positionAttributeLocation = positionAttributeLocation;
    program.colorUniformLocation = colorUniformLocation;
}

function startFusionSimulation(glContext, canvas) {
    console.log("Starting Fusion Simulation");
    if (!isRunning) {
        isRunning = true;
        animateFusion(glContext, canvas);
    }
}

function stopFusionSimulation() {
    console.log("Stopping Fusion Simulation");
    isRunning = false;
}

function updateFusionSimulation() {
    const controlRod = document.getElementById('controlRod').value / 100;
    const cooling = document.getElementById('cooling').value / 100;

    reactionRate = 100 * (1 - controlRod);
    temperature = 1000 + (5000 * reactionRate / 100) - (2000 * cooling);
    powerOutput = Math.max(0, (temperature - 1000) * 0.1);

    document.getElementById('temperature').textContent = Math.round(temperature);
    document.getElementById('powerOutput').textContent = powerOutput.toFixed(2);
    document.getElementById('reactionRate').textContent = Math.round(reactionRate);
}

function animateFusion(gl, canvas) {
    if (!isRunning) return;

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update particle positions and handle collisions
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Boundary checking
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Simple collision detection and reaction
        for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            let dx = p.x - p2.x;
            let dy = p.y - p2.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                // Collision occurred
                if (p.type !== p2.type) {
                    // Fusion reaction
                    p.type = 'neutron';
                    p2.type = 'neutron';
                    // Increase velocity to represent energy release
                    p.vx *= 1.5;
                    p.vy *= 1.5;
                    p2.vx *= 1.5;
                    p2.vy *= 1.5;
                }
            }
        }
    }

    // Draw particles
    drawParticles(gl, canvas);

    updateFusionSimulation();

    requestAnimationFrame(() => animateFusion(gl, canvas));
}

function drawParticles(gl, canvas) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    particles.forEach(p => {
        const positions = [
            p.x, p.y,
            p.x + 5, p.y,
            p.x, p.y + 5,
            p.x + 5, p.y + 5
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        if (p.type === 'neutron') {
            gl.uniform4f(program.colorUniformLocation, 1, 0, 0, 1); // Red for neutrons
        } else {
            gl.uniform4f(program.colorUniformLocation, 0, 0, 1, 1); // Blue for fuel particles
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
}

function createShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

function loadShader(gl, type, source) {
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

export { initFusionSimulation, startFusionSimulation, stopFusionSimulation, updateFusionSimulation };