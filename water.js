"use strict";
/* global define */

define(['shader'], function(Shader) {
  return function(gl) {
    var SIZE = 256;
    var vertexData = new Float32Array(12);
    for(var i = 0; i < 4; ++i) {
      vertexData[i*3+0] = (i & 1) * SIZE;
      vertexData[i*3+1] = (i & 2) * SIZE / 2;
      vertexData[i*3+2] = 0;
    }
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    var indexData = new Uint8Array(6);
    indexData[0] = 0; indexData[1] = 1; indexData[2] = 2;
    indexData[3] = 1; indexData[4] = 3; indexData[5] = 2;
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    
    var shader = new Shader(gl, {
      shared: [],
      vertex: [
        'attribute vec3 pos;',
        'uniform mat4 viewProjection;',
        'void main() {',
        '  gl_Position = viewProjection * vec4(pos, 1.0);',
        '}'
      ],
      fragment: [
        'void main() {',
        '  gl_FragColor = vec4(0.2, 0.2, 0.7, 0.8);',
        '}'
      ]
    });
    
    this.render = function(viewProjection) {
      shader.use();
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniformMatrix4fv(shader.viewProjection, false, viewProjection);
      gl.enableVertexAttribArray(shader.pos);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(shader.pos, 3, gl.FLOAT, false, 12, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
      gl.disableVertexAttribArray(shader.pos);
      gl.disable(gl.BLEND);
    };
  };
});