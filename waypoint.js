'use strict';
/* global define */

define(['shader'], function(Shader) {
  return function(gl) {
    var vertexData = new Int8Array(2 * 4);
    for(var i = 0; i < 4; ++i) {
      vertexData[i*2 + 0] = (i & 1) ? 1 : -1;
      vertexData[i*2 + 1] = (i & 2) >> 1;
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
      shared: [
        'varying mediump vec2 rp;',
      ],
      vertex: [
        'attribute vec2 sideHeight;',
        'uniform mat4 viewProjection;',
        'uniform vec3 cameraPos;',
        'uniform vec3 pos;',
        'void main() {',
        '  vec3 right = normalize(cross(pos - cameraPos, vec3(0.0, 0.0, 1.0)));',
        '  vec3 p = pos + right * sideHeight.x * 1.5;',
        '  p.z += sideHeight.y * 50.0;',
        '  gl_Position = viewProjection * vec4(p, 1.0);',
        '  rp = sideHeight;',
        '}'
      ],
      fragment: [
        'uniform lowp float time;',
        'void main() {',
        '  lowp float alpha = 0.5 + sin(rp.y * 64.0 - rp.x * rp.x + time * 6.282);',
        '  alpha *= (1.0 - rp.y) * (1.0 - abs(rp.x));',
        '  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);',
        '}'
      ]
    });
    
    this.render = function(viewProjection, cameraPos, pos, time) {
      shader.use();
      gl.uniformMatrix4fv(shader.viewProjection, false, viewProjection);
      gl.uniform3fv(shader.cameraPos, cameraPos);
      gl.uniform3fv(shader.pos, pos);
      gl.uniform1f(shader.time, time % 1.0);
      gl.enableVertexAttribArray(shader.sideHeight);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(shader.sideHeight, 2, gl.BYTE, false, 2, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.disableVertexAttribArray(shader.sideHeight);
    };
  };
});