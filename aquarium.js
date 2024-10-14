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
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
            this.rotation = Math.atan2(dy, dx);
        }

        // Keep player fish within canvas bounds
        this.x = Math.max(0, Math.min(this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.canvas.height, this.y));
        // Ensure canvas is accessed correctly using this.canvas
        // if (this.canvas) {
        //     this.x = Math.max(0, Math.min(this.canvas.width, this.x));
        //     this.y = Math.max(0, Math.min(this.canvas.height, this.y));
        // } else {
        //     console.error("Canvas is undefined in PlayerFish");
        // }
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

export function detectCollisions(canvas, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation) {
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
            }
        }
    }
}

export function updatePlayerMovement(canvas, keys, playerFish) {
    if (gameOver || !playerFish) return;

    const speed = 5;
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
        playerFish.update();
        playerFish.draw(gl, positionBuffer);
    }

    detectCollisions(canvas);
    updateScore();

    if (!gameOver) {
        requestAnimationFrame(() => renderAquarium(gl, canvas, positionBuffer));
    }
}

let program;
let positionAttributeLocation;
let colorUniformLocation;
let translationUniformLocation;
let rotationUniformLocation;
let scaleUniformLocation;
let animationFrameId;

export function initializeAquarium(gl, newProgram) {
    program = newProgram;
    gl.useProgram(program);

    positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    translationUniformLocation = gl.getUniformLocation(program, 'u_translation');
    rotationUniformLocation = gl.getUniformLocation(program, 'u_rotation');
    scaleUniformLocation = gl.getUniformLocation(program, 'u_scale');
}

export function startAquariumSimulation(gl, canvas, positionBuffer) {
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

    if (document.getElementById('enablePlayerFish').checked) {
        playerFish = new PlayerFish(canvas.width / 2, canvas.height / 2, canvas);
    } else {
        playerFish = null;
    }

    renderAquarium(gl, canvas, positionBuffer);
}

export function stopAquariumSimulation() {
    // This will cancel any running animation frame and stop the game loop.
    // gameOver = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Nullify WebGL-related variables
    program = null;
    positionAttributeLocation = null;
    colorUniformLocation = null;
    translationUniformLocation = null;
    rotationUniformLocation = null;
    scaleUniformLocation = null;
}