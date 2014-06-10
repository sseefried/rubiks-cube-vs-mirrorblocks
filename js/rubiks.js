var canvas;
var gl;
var eye = [0, 0, -10];
var center = [0, 0, 0];
var up = [0, 1, 0];
var mouseDown = false;
var x_init;
var y_init;
var x_new;
var y_new;

var shaderProgram;
var vertexPosition;
var vertexNormal;
var ambient;
var diffuse;
var specular;
var shininess;

var modelViewMatrix = mat4.create();
var projectionMatrix = mat4.create();
var rotationMatrix = mat4.create();

var cubeVerticesBuffer;
var cubeNormalsBuffer;
var cubeFacesBuffer;
var stickerVerticesBuffer;
var stickerNormalsBuffer;
var stickerFacesBuffer;

var COLORS = {
    'blue': [0.0, 0.0, 1.0, 1.0],
    'green': [0.0, 1.0, 0.0, 1.0],
    'orange': [1.0, 0.5, 0.0, 1.0],
    'red': [1.0, 0.0, 0.0, 1.0],
    'white': [1.0, 1.0, 1.0, 1.0],
    'yellow': [1.0, 1.0, 0.0, 1.0]
}

function initWebGL(canvas) {
    if (!window.WebGLRenderingContext) {
        console.log("Your browser doesn't support WebGL.")
            return null;
    }
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.log("Your browser supports WebGL, but initialization failed.");
        return null;
    }
    return gl;
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var source = '';
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == currentChild.TEXT_NODE) {
            source += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
    var shader;
    if (shaderScript.type == 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log('An error occurred while compiling the shader: ' + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initShaders() {
    var fragmentShader = getShader(gl, 'fragmentShader');
    var vertexShader = getShader(gl, 'vertexShader');
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, fragmentShader);
    gl.attachShader(shaderProgram, vertexShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log('Unable to initialize the shader program');
    }
    gl.useProgram(shaderProgram);
    vertexPosition = gl.getAttribLocation(shaderProgram, 'vertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    vertexNormal = gl.getAttribLocation(shaderProgram, 'vertexNormal');
    gl.enableVertexAttribArray(vertexNormal);
    eyePosition = gl.getUniformLocation(shaderProgram, 'eyePosition');
    gl.uniform3fv(eyePosition, eye);
    ambient = gl.getUniformLocation(shaderProgram, 'ambient');
    diffuse = gl.getUniformLocation(shaderProgram, 'diffuse');
    specular = gl.getUniformLocation(shaderProgram, 'specular');
    shininess = gl.getUniformLocation(shaderProgram, 'shininess');
}

function initCubeBuffers() {
    // vertices
    cubeVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeModel.vertices), gl.STATIC_DRAW);
    // normals
    cubeNormalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeModel.vertex_normals), gl.STATIC_DRAW);
    // faces
    cubeFacesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeFacesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeModel.faces), gl.STATIC_DRAW);
}

function initStickerBuffers() {
    // vertices
    stickerVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, stickerVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stickerModel.vertices), gl.STATIC_DRAW);
    // normals
    stickerNormalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, stickerNormalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stickerModel.vertex_normals), gl.STATIC_DRAW);
    // faces
    stickerFacesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stickerFacesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(stickerModel.faces), gl.STATIC_DRAW);
}

function drawScene() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawRubiksCube();
}

function drawCube() {
    gl.uniform4fv(ambient, cubeModel.ambient);
    gl.uniform4fv(diffuse, cubeModel.diffuse);
    gl.uniform4fv(specular, cubeModel.specular);
    gl.uniform1f(shininess, cubeModel.shininess);
    // vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    // normals
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalsBuffer);
    gl.vertexAttribPointer(vertexNormal, 3, gl.FLOAT, false, 0, 0);
    // faces
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeFacesBuffer);
    gl.drawElements(gl.TRIANGLES, cubeModel.faces.length, gl.UNSIGNED_SHORT, 0);
}

function drawSticker(color) {
    gl.uniform4fv(ambient, color);
    gl.uniform4fv(diffuse, stickerModel.diffuse);
    gl.uniform4fv(specular, stickerModel.specular);
    gl.uniform1f(shininess, stickerModel.shininess);
    // vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, stickerVerticesBuffer);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    // normals
    gl.bindBuffer(gl.ARRAY_BUFFER, stickerNormalsBuffer);
    gl.vertexAttribPointer(vertexNormal, 3, gl.FLOAT, false, 0, 0);
    // faces
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stickerFacesBuffer);
    gl.drawElements(gl.TRIANGLES, stickerModel.faces.length, gl.UNSIGNED_SHORT, 0);
}

function drawRubiksCube() {
    mat4.perspective(projectionMatrix,
            30,
            canvas.width / canvas.height,
            0.1,
            100.0);
    mat4.identity(modelViewMatrix);
    mat4.lookAt(modelViewMatrix, [0, 0, -10], [0, 0, 0], [0, 1, 0]);
    mat4.multiply(modelViewMatrix, modelViewMatrix, rotationMatrix);
    var mvMatrix = mat4.create();
    mat4.copy(mvMatrix, modelViewMatrix);
    for (var x = -1; x < 2; x++) {
        for (var y = -1; y < 2; y++) {
            for (var z = -1; z < 2; z++) {
                if (x == 0 && y == 0 && z == 0) {
                    continue;
                }
                mat4.translate(modelViewMatrix, modelViewMatrix, [2 * x, 2 * y, 2 * z]);
                setMatrixUniforms();
                drawCube();

                var _mvMatrix = mat4.create();
                mat4.copy(_mvMatrix, modelViewMatrix);
                if (x == -1) {
                    mat4.translate(modelViewMatrix, modelViewMatrix, [-1.001, 0, 0]);
                    mat4.rotateZ(modelViewMatrix, modelViewMatrix, degreesToRadians(90));
                    setMatrixUniforms();
                    drawSticker(COLORS['red']);
                    mat4.copy(modelViewMatrix, _mvMatrix);
                } else if (x == 1) {
                    mat4.translate(modelViewMatrix, modelViewMatrix, [1.001, 0, 0]);
                    mat4.rotateZ(modelViewMatrix, modelViewMatrix, degreesToRadians(-90));
                    setMatrixUniforms();
                    drawSticker(COLORS['orange']);
                    mat4.copy(modelViewMatrix, _mvMatrix);
                }
                if (y == -1) {
                    mat4.translate(modelViewMatrix, modelViewMatrix, [0, -1.001, 0]);
                    mat4.rotateX(modelViewMatrix, modelViewMatrix, degreesToRadians(-180));
                    setMatrixUniforms();
                    drawSticker(COLORS['yellow']);
                    mat4.copy(modelViewMatrix, _mvMatrix);
                } else if (y == 1) {
                    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 1.001, 0]);
                    setMatrixUniforms();
                    drawSticker(COLORS['white']);
                    mat4.copy(modelViewMatrix, _mvMatrix);
                }
                if (z == 1) {
                    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, 1.001]);
                    mat4.rotateX(modelViewMatrix, modelViewMatrix, degreesToRadians(90));
                    setMatrixUniforms();
                    drawSticker(COLORS['green']);
                    mat4.copy(modelViewMatrix, _mvMatrix);
                } else if (z == -1) {
                    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -1.001]);
                    mat4.rotateX(modelViewMatrix, modelViewMatrix, degreesToRadians(-90));
                    setMatrixUniforms();
                    drawSticker(COLORS['blue']);
                    mat4.copy(modelViewMatrix, _mvMatrix);
                }
                mat4.copy(modelViewMatrix, mvMatrix);
            }
        }
    }
}

function tick() {
    requestAnimationFrame(tick);
    drawScene();
}

function start() {
    canvas = document.getElementById('glcanvas');
    gl = initWebGL(canvas);
    initShaders();
    initCubeBuffers();
    initStickerBuffers();
    if (gl) {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        tick();
    }
}

function setMatrixUniforms() {
    var projectionUniform = gl.getUniformLocation(shaderProgram, 'projectionMatrix');
    gl.uniformMatrix4fv(projectionUniform, false, projectionMatrix);
    var modelViewUniform = gl.getUniformLocation(shaderProgram, 'modelViewMatrix');
    gl.uniformMatrix4fv(modelViewUniform, false, modelViewMatrix);
    var _normalMatrix = mat4.create();
    mat4.invert(_normalMatrix, modelViewMatrix);
    mat4.transpose(_normalMatrix, _normalMatrix);
    var normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, _normalMatrix);
    var normalMatrixUniform = gl.getUniformLocation(shaderProgram, 'normalMatrix');
    gl.uniformMatrix3fv(normalMatrixUniform, false, normalMatrix);
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function rotate(event) {
    if (mouseDown) {
        x_new = event.pageX;
        y_new = event.pageY;
        delta_x = (x_new - x_init) / 10;
        delta_y = (y_new - y_init) / 10;
        var axis = [delta_y, -delta_x, 0];
        var degrees = Math.sqrt(delta_x * delta_x + delta_y * delta_y);
        var newRotationMatrix = mat4.create();
        mat4.rotate(newRotationMatrix, newRotationMatrix, degreesToRadians(degrees), axis);
        mat4.multiply(rotationMatrix, newRotationMatrix, rotationMatrix);
    }
}

function startRotate(event) {
    mouseDown = true;
    x_init = event.pageX;
    y_init = event.pageY;
}

function endRotate(event) {
    mouseDown = false;
}

$(document).ready(function() {
    start();
    $('#glcanvas').mousedown(startRotate);
    $('#glcanvas').mousemove(rotate);
    $('#glcanvas').mouseup(endRotate);
});
