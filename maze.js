class BouncingSquare {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.dx = 3;
        this.dy = 3;
        this.size = 20;
        this.color = [Math.random(), Math.random(), Math.random(), 1];
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x < 0 || this.x > canvas.width) {
            this.dx *= -1;
            this.randomizeColor();
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.dy *= -1;
            this.randomizeColor();
        }
    }

    randomizeColor() {
        this.color = [Math.random(), Math.random(), Math.random(), 1];
    }

    draw() {
        gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
        gl.uniform4fv(colorUniformLocation, this.color);
        gl.uniform2f(translationUniformLocation, this.x, this.y);
        gl.uniform1f(rotationUniformLocation, 0);
        gl.uniform1f(scaleUniformLocation, this.size);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

function renderMazeSimulation() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderMaze();
    bouncingSquare.update();
    bouncingSquare.draw();
    checkWallCollisions();
    requestAnimationFrame(renderMazeSimulation);
}

function renderMaze() {
    mazeWalls.forEach(wall => {
        gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
        gl.uniform4fv(colorUniformLocation, [0.2, 0.2, 0.2, 1]);
        gl.uniform2f(translationUniformLocation, wall.x + wall.size / 2, wall.y + wall.size / 2);
        gl.uniform1f(rotationUniformLocation, 0);
        gl.uniform1f(scaleUniformLocation, wall.size);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    });
}
