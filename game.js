define(['terrain', 'gl-matrix-min'], function(Terrain, M) {
  return function(gl) {
    var terrain = new Terrain(gl);
    
    var projection = M.mat4.create();
    var view = M.mat4.create();
    var viewProjection = M.mat4.create();
    
    var angle = 0;
    
    this.update = function(timeStep) {
      angle += timeStep;
      M.mat4.lookAt(view, [128 + Math.sin(angle) * 100, 128 + Math.cos(angle) * 100, 50], [128, 128, 0], [0, 0, 1]);
    };
    
    this.render = function() {
      M.mat4.perspective(projection, 40 / 128 * Math.PI, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 500);
      
      M.mat4.mul(viewProjection, projection, view);
    
      terrain.render(viewProjection);
    };
  };
});