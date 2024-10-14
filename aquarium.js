const fishVertices = new Float32Array([
    -15, -10,
    15, 0,
    -15, 10,
    -5, 0
]);

class Fish {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.rotation = Math.atan2(this.dy, this.dx);
        this.color = [Math.random(), Math.random(), Math.random(), 1];
        this.scale = 1;
        this.canvas = canvas;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Keep fish within the canvas bounds
        if (this.x < 0 || this.x > this.canvas.width) this.dx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.dy *= -1;

        this.rotation = Math.atan2(this.dy, this.dx);
    }

    draw(gl, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation) {
        // Set the vertices for the fish
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, fishVertices, gl.STATIC_DRAW);

        // Set the color uniform
        gl.uniform4fv(colorUniformLocation, this.color);

        // Set the translation for this fish
        gl.uniform2f(translationUniformLocation, this.x, this.y);

        // Set the rotation and scale uniforms
        gl.uniform1f(rotationUniformLocation, this.rotation);
        gl.uniform1f(scaleUniformLocation, this.scale);

        // Draw the fish using TRIANGLE_FAN (4 vertices forming the fish shape)
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

class PlayerFish extends Fish {
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

export function detectCollisions() {
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

export function renderAquarium(gl, canvas, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable the position attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    fishes.forEach(fish => {
        fish.update();
        fish.draw(gl, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation);
    });

    if (playerFish) {
        playerFish.update();
        playerFish.draw(gl, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation);
    }

    detectCollisions();

    if (!gameOver) {
        requestAnimationFrame(() => renderAquarium(gl, canvas, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation));
    }
}

export function startAquariumSimulation(gl, canvas, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation) {
    fishes.length = 0;
    gameOver = false;
    startTime = Date.now();

    // Add initial fish to the simulation
    for (let i = 0; i < 5; i++) {
        addFish(canvas);
    }

    if (document.getElementById('enablePlayerFish').checked) {
        playerFish = new PlayerFish(canvas.width / 2, canvas.height / 2, canvas);
    } else {
        playerFish = null;
    }

    renderAquarium(gl, canvas, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, rotationUniformLocation, scaleUniformLocation);
}
