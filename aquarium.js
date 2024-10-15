const fishVertices = new Float32Array([
    -15, -10,
    15, 0,
    -15, 10,
    -5, 0
]);

export class Fish {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.rotation = Math.atan2(this.dy, this.dx);
        this.color = [Math.random(), Math.random(), Math.random(), 1];
        this.scale = 1;
        this.baseSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x < 0 || this.x > this.canvas.width) this.dx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.dy *= -1;

        this.rotation = Math.atan2(this.dy, this.dx);
    }

    draw(gl) {
        if (!program) return; // Exit if the program has been nullified

        gl.bufferData(gl.ARRAY_BUFFER, fishVertices, gl.STATIC_DRAW);
        gl.uniform4fv(colorUniformLocation, this.color);
        gl.uniform2f(translationUniformLocation, this.x, this.y);
        gl.uniform1f(rotationUniformLocation, this.rotation);
        gl.uniform1f(scaleUniformLocation, this.scale);
    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    resetSpeed() {
        const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        const scaleFactor = this.baseSpeed / currentSpeed;
        this.dx *= scaleFactor;
        this.dy *= scaleFactor;
    }
}

export class PlayerFish extends Fish {
    constructor(x, y, canvas) {
        super(x, y, canvas);
        this.color = [1, 0, 0, 1];  // Red color for player fish
        this.scale = 1.2;  // Slightly larger than other fish
        this.speed = 3;
        this.targetX = x;
        this.targetY = y;
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.1) {
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            this.x += moveX;
            this.y += moveY;
        }
        
        const speed = 3;
    
        // Determine movement based on key presses
        if (keys['ArrowUp']) {
            this.y -= speed;
            this.rotation = -Math.PI / 2;  // Facing up
        }
        if (keys['ArrowDown']) {
            this.y += speed;
            this.rotation = Math.PI / 2;  // Facing down
        }
        if (keys['ArrowLeft']) {
            this.x -= speed;
            this.rotation = Math.PI;  // Facing left
        }
        if (keys['ArrowRight']) {
            this.x += speed;
            this.rotation = 0;  // Facing right
        }

        // If diagonal movement, adjust the rotation accordingly
        if (keys['ArrowUp'] && keys['ArrowRight']) {
            this.rotation = -Math.PI / 4;  // Facing up-right
        }
        if (keys['ArrowUp'] && keys['ArrowLeft']) {
            this.rotation = -3 * Math.PI / 4;  // Facing up-left
        }
        if (keys['ArrowDown'] && keys['ArrowRight']) {
            this.rotation = Math.PI / 4;  // Facing down-right
        }
        if (keys['ArrowDown'] && keys['ArrowLeft']) {
            this.rotation = 3 * Math.PI / 4;  // Facing down-left
        }

        // Ensure player fish stays within canvas bounds
        this.x = Math.max(0, Math.min(this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.canvas.height, this.y));
        
        // Keep player fish within canvas bounds
        this.x = Math.max(0, Math.min(this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.canvas.height, this.y));
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.rotation = 0;
    }
}

let fishes = [];
let playerFish;
let gameOver = false;
let startTime = Date.now();

export function addFish(canvas) {
    if (gameOver) return;

    let newFish;
    do {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        newFish = new Fish(x, y, canvas);
    } while (isTooClose(newFish));

    fishes.push(newFish);
}

function isTooClose(fish) {
    const minDistance = 50;
    return fishes.some(otherFish => 
        Math.hypot(fish.x - otherFish.x, fish.y - otherFish.y) < minDistance
    ) || (playerFish && Math.hypot(fish.x - playerFish.x, fish.y - playerFish.y) < minDistance);
}

export function removeFish() {
    if (fishes.length > 0) {
        fishes.pop();
    }
}

export function detectCollisions(gl, canvas, positionBuffer) {
    if (gameOver) return;

    for (let i = 0; i < fishes.length; i++) {
        for (let j = i + 1; j < fishes.length; j++) {
            const dx = fishes[i].x - fishes[j].x;
            const dy = fishes[i].y - fishes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) {  // Assuming fish size is about 30 pixels
                // Simple collision response: reverse directions
                [fishes[i].dx, fishes[j].dx] = [fishes[j].dx, fishes[i].dx];
                [fishes[i].dy, fishes[j].dy] = [fishes[j].dy, fishes[i].dy];
            }
        }

        // Check collision with player fish
        if (playerFish) {
            const dx = fishes[i].x - playerFish.x;
            const dy = fishes[i].y - playerFish.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) {
                gameOver = true;
                alert(`Game Over! You survived for ${Math.floor((Date.now() - startTime) / 1000)} seconds.`);
                // Reset fish speed after game over
                fishes.forEach(fish => fish.resetSpeed());
                startAquariumSimulation(gl, canvas, positionBuffer); // Restart the game
                return;
            }
        }
    }
}

export function updatePlayerMovement(canvas, keys, playerFish) {
    if (gameOver || !playerFish) return;

    const speed = 2;
    if (keys['ArrowUp']) playerFish.targetY -= speed;
    if (keys['ArrowDown']) playerFish.targetY += speed;
    if (keys['ArrowLeft']) playerFish.targetX -= speed;
    if (keys['ArrowRight']) playerFish.targetX += speed;

    // Keep target within canvas bounds
    playerFish.targetX = Math.max(0, Math.min(canvas.width, playerFish.targetX));
    playerFish.targetY = Math.max(0, Math.min(canvas.height, playerFish.targetY));
}

export function updateScore() {
    if (gameOver) return;
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('score').textContent = `Time: ${elapsedTime}s`;
}

export function renderAquarium(gl, canvas, positionBuffer) {
    if (!program) return; // Exit if the program has been nullified
    // Ensure the correct program is being used
    gl.useProgram(program);  // Ensure you use the right program for aquarium rendering
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    fishes.forEach(fish => {
        fish.update();
        fish.draw(gl, positionBuffer);
    });

    if (playerFish) {
        updatePlayerMovement(canvas, keys, playerFish);
        playerFish.update();
        playerFish.draw(gl, positionBuffer);
    }

    detectCollisions(gl, canvas, positionBuffer);
    updateScore();

    if (!gameOver) {
        // requestAnimationFrame(() => renderAquarium(gl, canvas, positionBuffer));
        animationFrameId = requestAnimationFrame(() => renderAquarium(gl, canvas, positionBuffer));
    }
}

let program;
let positionAttributeLocation;
let colorUniformLocation;
let translationUniformLocation;
let rotationUniformLocation;
let scaleUniformLocation;
let animationFrameId;
let keys = {};

export function initializeAquarium(gl, newProgram) {
    program = newProgram;
    gl.useProgram(program);

    positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    translationUniformLocation = gl.getUniformLocation(program, 'u_translation');
    rotationUniformLocation = gl.getUniformLocation(program, 'u_rotation');
    scaleUniformLocation = gl.getUniformLocation(program, 'u_scale');

    // Add event listeners for keydown and keyup
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}


function handleKeyDown(event) {
    keys[event.key] = true;
}

function handleKeyUp(event) {
    keys[event.key] = false;
}

export function startAquariumSimulation(gl, canvas, positionBuffer) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;  // Ensure it’s cleared
    }

    fishes.length = 0;
    gameOver = false;
    startTime = Date.now();

    gl.useProgram(program);  // Ensure you're using the aquarium program

    // Clear the buffer for fresh rendering
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.1, 0.5, 0.9, 1.0);  // Set the blue background
    

    for (let i = 0; i < 5; i++) {
        addFish(canvas);
    }

    keys = {};
    
    // Reset speed for all fishes
    fishes.forEach(fish => fish.resetSpeed());

    resetPlayerFish(canvas);

    // renderAquarium(gl, canvas, positionBuffer);
    animationFrameId = requestAnimationFrame(() => renderAquarium(gl, canvas, positionBuffer));
}

function resetPlayerFish(canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    if (document.getElementById('enablePlayerFish').checked) {
        if (playerFish) {
            playerFish.reset(centerX, centerY);
        } else {
            playerFish = new PlayerFish(centerX, centerY, canvas);
        }
    } else {
        playerFish = null;
    }
}

export function stopAquariumSimulation() {
    // This will cancel any running animation frame and stop the game loop.
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Remove event listeners when stopping the simulation
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    // Nullify WebGL-related variables
    program = null;
    positionAttributeLocation = null;
    colorUniformLocation = null;
    translationUniformLocation = null;
    rotationUniformLocation = null;
    scaleUniformLocation = null;
}