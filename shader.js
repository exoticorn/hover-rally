"use strict";
/* global define */

define(function() {
  return function(gl, source) {
    function makeShader(src, type) {
      var shader = gl.createShader(type);
      src = source.shared.concat(src).join('\n');
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(src);
        console.log(gl.getShaderInfoLog(shader));
        throw 'shader compile failed';
      }
      return shader;
    }
    
    var program = gl.createProgram();
    gl.attachShader(program, makeShader(source.vertex, gl.VERTEX_SHADER));
    gl.attachShader(program, makeShader(source.fragment, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }
    
    var i;
    var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for(i = 0; i < numAttributes; ++i) {
      this[gl.getActiveAttrib(program, i).name] = i;
    }
    
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for(i = 0; i < numUniforms; ++i) {
      var uniform = gl.getActiveUniform(program, i);
      this[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }

    this.use = function() {
      gl.useProgram(program);
    };
  };
});