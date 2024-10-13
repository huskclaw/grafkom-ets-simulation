const squareVertices = new Float32Array([
    -0.5, -0.5,
    0.5, -0.5,
    0.5, 0.5,
    -0.5, 0.5
]);

export class Square {
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

        // Bounce off walls
        if (this.x - this.size / 2 < 0 || this.x + this.size / 2 > canvas.width) {
            this.velocity *= -1;
        }
    }

    draw(gl, positionBuffer, positionAttributeLocation, colorUniformLocation, translationUniformLocation, scaleUniformLocation) {
        gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
        gl.uniform4fv(colorUniformLocation, this.color);
        gl.uniform2f(translationUniformLocation, this.x, canvas.height / 2);
        gl.uniform1f(scaleUniformLocation, this.size);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}
