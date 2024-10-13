const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
}

const vertexShaderSource = `
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

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;

    void main() {
        gl_FragColor = u_color;
    }
`;

function createShader(gl, type, source) {
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

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
const translationUniformLocation = gl.getUniformLocation(program, 'u_translation');
const rotationUniformLocation = gl.getUniformLocation(program, 'u_rotation');
const scaleUniformLocation = gl.getUniformLocation(program, 'u_scale');

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const fishVertices = new Float32Array([
    -15, -10,
    15, 0,
    -15, 10,
    -5, 0
]);

const squareVertices = new Float32Array([
    -0.5, -0.5,
    0.5, -0.5,
    0.5, 0.5,
    -0.5, 0.5
]);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0.1, 0.5, 0.9, 1.0);

gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
