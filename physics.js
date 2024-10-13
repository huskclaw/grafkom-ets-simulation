class Square {
    constructor(x, y, mass, isMoving) {
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.velocity = isMoving ? -2 : 0;
        this.color = isMoving ? [0, 1, 0, 1] : [1, 0, 0, 1];
        this.size = 50;
    }

    update(friction) {
        this.x += this.velocity;
        this.velocity *= (1 - friction);

        if (this.x - this.size / 2 < 0 || this.x + this.size / 2 > canvas.width) {
            this.velocity *= -1;
        }
    }

    draw() {
        gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
        gl.uniform4fv(colorUniformLocation, this.color);
        gl.uniform2f(translationUniformLocation, this.x, canvas.height / 2);
        gl.uniform1f(rotationUniformLocation, 0);
        gl.uniform1f(scaleUniformLocation, this.size);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

function renderPhysics() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const friction = parseFloat(document.getElementById('friction').value);

    square1.update(friction);
    square2.update(friction);

    handleCollision();

    square1.draw();
    square2.draw();

    requestAnimationFrame(renderPhysics);
}
