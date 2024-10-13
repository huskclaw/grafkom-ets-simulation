class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.rotation = Math.atan2(this.dy, this.dx);
        this.color = [Math.random(), Math.random(), Math.random(), 1];
        this.scale = 1;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.dy *= -1;

        this.rotation = Math.atan2(this.dy, this.dx);
    }

    draw() {
        gl.bufferData(gl.ARRAY_BUFFER, fishVertices, gl.STATIC_DRAW);
        gl.uniform4fv(colorUniformLocation, this.color);
        gl.uniform2f(translationUniformLocation, this.x, this.y);
        gl.uniform1f(rotationUniformLocation, this.rotation);
        gl.uniform1f(scaleUniformLocation, this.scale);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

class PlayerFish extends Fish {
    constructor(x, y) {
        super(x, y);
        this.color = [1, 0, 0, 1];
        this.scale = 1.2;
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

        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
    }
}

function renderAquarium() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    fishes.forEach(fish => {
        fish.update();
        fish.draw();
    });

    if (playerFish) {
        playerFish.update();
        playerFish.draw();
    }
    detectCollisions();
    updateScore();
}
