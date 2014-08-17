'use strict';
/* global define */

define(['shader'], function(Shader) {
  return function(gl) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.0)';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans';
    ctx.textBaseline = 'middle';
    var lineHeight = 32;
    var chars = ' :0123456789.abcdefghijklmnoprstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var x = 0;
    var y = 0;
    var charData = {};
    for(var i = 0; i < chars.length; ++i) {
      var c = chars.charAt(i);
      var width = ctx.measureText(c).width;
      if(x + width >= canvas.width) {
        x = 0;
        y += lineHeight;
      }
      ctx.fillText(c, x, y + lineHeight * 0.5);
      charData[c.charCodeAt(0)] = {
        u: x / canvas.width,
        v: y / canvas.height,
        w: width
      };
      x += width + 1;
    }
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    var batchSize = 32;
    var vertexData = new Float32Array(batchSize * 4 * 4);
    var vertexBuffer = gl.createBuffer();
    var indexData = new Uint16Array(batchSize * 6);
    for(i = 0; i < batchSize; ++i) {
      indexData[i*6+0] = i*4+0;
      indexData[i*6+1] = i*4+1;
      indexData[i*6+2] = i*4+2;
      indexData[i*6+3] = i*4+1;
      indexData[i*6+4] = i*4+3;
      indexData[i*6+5] = i*4+2;
    }
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    
    var shader = new Shader(gl, {
      shared: [
        'varying mediump vec2 uv;'
      ],
      vertex: [
        'uniform vec4 screenSystem;',
        'attribute vec4 posUv;',
        'void main() {',
        '  gl_Position = vec4(posUv.xy * screenSystem.xy + screenSystem.zw, 0.0, 1.0);',
        '  uv = posUv.zw;',
        '}'
      ],
      fragment: [
        'uniform lowp vec4 color;',
        'uniform sampler2D texture;',
        'void main() {',
        '  gl_FragColor = texture2D(texture, uv) * color;',
        '}'
      ]
    });
    
    function renderBatch(text, x, y, start, count) {
      var o = 0;
      for(var i = start; i < count; ++i) {
        var c = charData[text.charCodeAt(i)];
        if(c) {
          var w = c.w / canvas.width;
          var h = lineHeight / canvas.height;
          for(var j = 0; j < 4; ++j) {
            var dx = j & 1;
            var dy = (j & 2) >> 1;
            vertexData[o+0] = x + dx * c.w;
            vertexData[o+1] = y + dy * lineHeight;
            vertexData[o+2] = c.u + dx * w;
            vertexData[o+3] = c.v + dy * h;
            o += 4;
          }
          x += c.w;
        }
      }
      gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STREAM_DRAW);
      gl.drawElements(gl.TRIANGLES, o / 16 * 6, gl.UNSIGNED_SHORT, 0);
    }
    
    this.render = function(screenSystem, text, x, y) {
      shader.use();
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.enableVertexAttribArray(shader.posUv);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(shader.posUv, 4, gl.FLOAT, false, 16, 0);
      gl.uniform4fv(shader.screenSystem, screenSystem);
      gl.uniform4f(shader.color, 1.0, 1.0, 1.0, 1.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(shader.texture, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      
      var i = 0;
      while(i < text.length) {
        var count = Math.min(batchSize, text.length - i);
        x = renderBatch(text, x, y, i, count);
        i += count;
      }
      
      gl.disableVertexAttribArray(shader.posUv);
      gl.disable(gl.BLEND);
    };
  };
});