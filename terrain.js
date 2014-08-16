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

    var x, y, i;
    for(var size = SIZE >> 1; size >= 1; size >>= 1) {
      var scale = Math.pow(size / SIZE * 2, 1.3) * SIZE / 8;
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
    samples.sort();
    var waterHeight = samples[Math.floor(samples.length / 3)];
    
    for(i = 0; i < SIZE*SIZE; ++i) {
      height[i] -= waterHeight;
    }

    this.heightAt = function(x, y) {
      x = Math.max(0, Math.min(SIZE, x));
      y = Math.max(0, Math.min(SIZE, y));
      var xi = Math.min(SIZE-1, Math.floor(x));
      var yi = Math.min(SIZE-1, Math.floor(y));
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

    var vertexData = new Float32Array(SIZE * SIZE* 4);
    for(y = 0; y < SIZE; ++y) {
      for(x = 0; x < SIZE; ++x) {
        var h = height[index(x, y)];
        var h1 = height[index(x + 1, y)];
        vertexData[(x + y * SIZE) * 4 + 0] = x;
        vertexData[(x + y * SIZE) * 4 + 1] = y;
        vertexData[(x + y * SIZE) * 4 + 2] = h;
        vertexData[(x + y * SIZE) * 4 + 3] = h-h1;
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
        'varying mediump float height;'
      ],
      vertex: [
        'attribute vec4 pos;',
        'uniform mat4 viewProjection;',
        'void main() {',
        '  color = vec3(0.5 + pos.w * 0.3);',
        '  height = pos.z;',
        '  gl_Position = viewProjection * vec4(pos.x, pos.y, pos.z, 1.0);',
        '}'
      ],
      fragment: [
        'void main() {',
        '  gl_FragColor = vec4(color, 1.0);',
        '}'
      ]
    });
    
    this.render = function(viewProjection) {
      shader.use();
      gl.uniformMatrix4fv(shader.viewProjection, false, viewProjection);
      gl.enableVertexAttribArray(shader.pos);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(shader.pos, 4, gl.FLOAT, false, 16, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, (SIZE-1) * (SIZE-1) * 6, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(shader.pos);
    };
  };
});