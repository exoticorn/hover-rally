"use strict";
/* global define */

define(['shader', 'gl-matrix-min'], function(Shader, M) {
  return function(gl) {
    var SIZE = 256;

    var height = new Float32Array(SIZE*SIZE);
    function index(x, y) {
      return (x & (SIZE-1)) + (y & (SIZE-1)) * SIZE;
    }
    function linear(bx, by, ox, oy, scale, factor) {
      var a0 = height[index(bx - ox * 2, by - oy * 2)];
      var a = height[index(bx, by)];
      var b = height[index(bx + ox * 2, by + oy * 2)];
      var b0 = height[index(bx + ox * 4, by + oy * 4)];
      var i = index(bx + ox, by + oy);
      height[i] += ((a + b) * 9 - (a0 + b0) * 1) / 16 * factor + (Math.random() * 2 - 1) * scale;
    }

    var x, y, i, h;
    for(var size = SIZE >> 1; size >= 1; size >>= 1) {
      var scale = Math.pow(Math.atan(size / SIZE * 2 * 4) / 4, 1.3) * SIZE / 4;
      for(x = 0; x < SIZE; x += size * 2) {
        for(y = 0; y < SIZE; y += size * 2) {
          linear(x, y, size, 0, scale, 1);
          linear(x, y, 0, size, scale, 1);
        }
      }
      for(x = 0; x < SIZE; x += size * 2) {
        for(y = 0; y < SIZE; y += size * 2) {
          linear(x, y + size, size, 0, scale, 0.5);
          linear(x + size, y, 0, size, 0, 0.5);
        }
      }
    }
    
    var samples = [];
    for(x = 0; x < SIZE; x += 32) {
      for(y = 0; y < SIZE; y += 32) {
        samples.push(height[x + y * SIZE]);
      }
    }
    samples = samples.sort(function(a, b) { return a - b; });
    var waterHeight = samples[Math.floor(samples.length / 3)];
    
    for(i = 0; i < SIZE*SIZE; ++i) {
      h = height[i] - waterHeight;
      h = 0.4 * h + 0.0005 * Math.pow(h, 3);
      height[i] = h;
    }

    this.heightAt = function(x, y) {
      x = Math.max(0, Math.min(SIZE, x));
      y = Math.max(0, Math.min(SIZE, y));
      var xi = Math.min(SIZE-2, Math.floor(x));
      var yi = Math.min(SIZE-2, Math.floor(y));
      var o = xi + yi * SIZE;
      x -= xi;
      y -= yi;
      var a = height[o] * (1 - x) + height[o + 1] * x;
      var b = height[o + SIZE] * (1 - x) + height[o + 1 + SIZE] * x;
      return Math.max(0, a * (1 - y) + b * y);
    };
    
    this.normalAt = function(out, x, y) {
      out[0] = this.heightAt(x - 0.5, y) - this.heightAt(x + 0.5, y);
      out[1] = this.heightAt(x, y - 0.5) - this.heightAt(x, y + 0.5);
      out[2] = 1;
      M.vec3.normalize(out, out);
    };

    var vertexData = new ArrayBuffer(SIZE * SIZE * 12);
    var vertexView8 = new Uint8Array(vertexData);
    var vertexViewS8 = new Int8Array(vertexData);
    var vertexViewFloat = new Float32Array(vertexData);
    var normal = M.vec3.create();
    for(y = 0; y < SIZE; ++y) {
      for(x = 0; x < SIZE; ++x) {
        h = height[index(x, y)];
        i = x + y * SIZE;
        vertexViewFloat[i * 3] = h;
        this.normalAt(normal, x, y);
        vertexView8[i * 12 + 4] = x;
        vertexView8[i * 12 + 5] = y;
        vertexViewS8[i * 12 + 6] = normal[0] * 127;
        vertexViewS8[i * 12 + 7] = normal[1] * 127;
        vertexViewS8[i * 12 + 8] = normal[2] * 127;
      }
    }
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    vertexData = undefined;
    
    var indexData = new Uint16Array((SIZE-1) * (SIZE-1) * 6);
    for(y = 0; y < SIZE-1; ++y) {
      for(x = 0; x < SIZE-1; ++x) {
        i = (x + y * (SIZE-1)) * 6;
        indexData[i+0] = x + y * SIZE;
        indexData[i+1] = (x + 1) + y * SIZE;
        indexData[i+2] = (x + 1) + (y + 1) * SIZE;
        indexData[i+3] = x + y * SIZE;
        indexData[i+4] = (x + 1) + (y + 1) * SIZE;
        indexData[i+5] = x + (y + 1) * SIZE;
      }
    }
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    indexData = undefined;
    
    var shader = new Shader(gl, {
      shared: [
        'varying lowp vec3 color;',
        'varying mediump vec3 r;',
      ],
      vertex: [
        'attribute vec2 pos;',
        'attribute float height;',
        'attribute vec3 normal;',
        'uniform mat4 viewProjection;',
        'uniform vec3 cameraPos;',
        'void main() {',
        '  color = vec3(1.0, 0.7, 0.5) * (0.5 + normal.x * 0.005);',
        '  vec3 p = vec3(pos.x, pos.y, height);',
        '  r = reflect(p - cameraPos, normal / 127.0);',
        '  r = normalize(r);',
        '  gl_Position = viewProjection * vec4(p, 1.0);',
        '}'
      ],
      fragment: [
        'void main() {',
        '  gl_FragColor = vec4(color + vec3(0.4, 0.6, 0.8) * (1.0 - length(r.xy)), 1.0);',
        '}'
      ]
    });
    
    this.render = function(viewProjection, cameraPos) {
      shader.use();
      gl.uniformMatrix4fv(shader.viewProjection, false, viewProjection);
      gl.uniform3fv(shader.cameraPos, cameraPos);
      gl.enableVertexAttribArray(shader.pos);
      gl.enableVertexAttribArray(shader.height);
      gl.enableVertexAttribArray(shader.normal);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(shader.pos, 2, gl.UNSIGNED_BYTE, false, 12, 4);
      gl.vertexAttribPointer(shader.height, 1, gl.FLOAT, false, 12, 0);
      gl.vertexAttribPointer(shader.normal, 3, gl.BYTE, false, 12, 6);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, (SIZE-1) * (SIZE-1) * 6, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(shader.pos);
      gl.disableVertexAttribArray(shader.height);
      gl.disableVertexAttribArray(shader.normal);
    };
  };
});