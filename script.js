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

        // Aquarium Simulation
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
                this.color = [1, 0, 0, 1]; // Red color for player fish
                this.scale = 1.2; // Slightly larger than other fish
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
                this.x = Math.max(0, Math.min(canvas.width, this.x));
                this.y = Math.max(0, Math.min(canvas.height, this.y));
            }
        }

        const fishes = [];
        let playerFish;
        let gameOver = false;
        let startTime = Date.now();

        function addFish() {
            if (gameOver) return;
            
            let newFish;
            do {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                newFish = new Fish(x, y);
            } while (isTooClose(newFish));

            fishes.push(newFish);
        }

        function isTooClose(fish) {
            const minDistance = 50;
            return fishes.some(otherFish => 
                Math.hypot(fish.x - otherFish.x, fish.y - otherFish.y) < minDistance
            ) || (playerFish && Math.hypot(fish.x - playerFish.x, fish.y - playerFish.y) < minDistance);
        }

        function removeFish() {
            if (fishes.length > 0) {
                fishes.pop();
            }
        }

        document.getElementById('addFish').addEventListener('click', addFish);
        document.getElementById('removeFish').addEventListener('click', removeFish);

        function detectCollisions() {
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

        const keys = {};

        function handleKeyDown(event) {
            keys[event.key] = true;
        }

        function handleKeyUp(event) {
            keys[event.key] = false;
        }

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        function updatePlayerMovement() {
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

        function updateScore() {
            if (gameOver) return;
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            document.getElementById('score').textContent = `Time: ${elapsedTime}s`;
        }

        function renderAquarium() {
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

            updatePlayerMovement();

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

            if (!gameOver) {
                requestAnimationFrame(renderAquarium);
            }
        }

        // Physics Simulation
        class Square {
            constructor(x, y, mass, isMoving) {
                this.x = x;
                this.y = y;
                this.mass = mass;
                this.velocity = isMoving ? -2 : 0;  // Initial velocity for moving square
                this.color = isMoving ? [0, 1, 0, 1] : [1, 0, 0, 1];  // Green for moving, Red for still
                this.size = 50;  // Size of the square
            }

            update(friction) {
                this.x += this.velocity;
                this.velocity *= (1 - friction);  // Apply friction

                // Bounce off walls
                if (this.x - this.size/2 < 0 || this.x + this.size/2 > canvas.width) {
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

        let square1, square2;

        function initPhysicsSimulation() {
            const mass1 = parseFloat(document.getElementById('mass1').value);
            const mass2 = parseFloat(document.getElementById('mass2').value);
            square1 = new Square(200, canvas.height / 2, mass1, false);
            square2 = new Square(600, canvas.height / 2, mass2, true);
        }

        function handleCollision() {
            if (Math.abs(square1.x - square2.x) <= square1.size) {
                // Perfectly elastic collision
                const v1 = square1.velocity;
                const v2 = square2.velocity;
                const m1 = square1.mass;
                const m2 = square2.mass;

                square1.velocity = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
                square2.velocity = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
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

        function resetPhysicsSimulation() {
            initPhysicsSimulation();
        }

        document.getElementById('resetPhysics').addEventListener('click', resetPhysicsSimulation);

        function switchSimulation() {
            const simulationType = document.getElementById('simulationSelect').value;
            if (simulationType === 'aquarium') {
                document.getElementById('aquariumControls').style.display = 'block';
                document.getElementById('physicsControls').style.display = 'none';
                startAquariumSimulation();
            } else {
                document.getElementById('aquariumControls').style.display = 'none';
                document.getElementById('physicsControls').style.display = 'block';
                startPhysicsSimulation();
            }
        }

        function startAquariumSimulation() {
            fishes.length = 0;
            gameOver = false;
            startTime = Date.now();

            for (let i = 0; i < 5; i++) {
                addFish();
            }

            if (document.getElementById('enablePlayerFish').checked) {
                playerFish = new PlayerFish(canvas.width / 2, canvas.height / 2);
            } else {
                playerFish = null;
            }

            renderAquarium();
        }

        function startPhysicsSimulation() {
            initPhysicsSimulation();
            renderPhysics();
        }

        document.getElementById('simulationSelect').addEventListener('change', switchSimulation);
        document.getElementById('enablePlayerFish').addEventListener('change', () => {
            if (document.getElementById('simulationSelect').value === 'aquarium') {
                startAquariumSimulation();
            }
        });

        // Start with aquarium simulation by default
        startAquariumSimulation();