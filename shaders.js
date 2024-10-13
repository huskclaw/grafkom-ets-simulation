export const vertexShaderSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    uniform float u_rotation;
    uniform float u_scale;

    void main() {
        vec2 scaledPosition = a_position * u_scale;
        vec2 rotatedPosition = vec2(
            scaledPosition.x * cos(u_rotation) - scaledPosition.y * sin(u_rotation),
            scaledPosition.x * sin(u_rotation) + scaledPosition.y * cos(u_rotation)
        );
        vec2 position = rotatedPosition + u_translation;
        vec2 zeroToOne = position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
`;

export const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;

    void main() {
        gl_FragColor = u_color;
    }
`;
