define(['terrain', 'craft', 'water', 'gl-matrix-min'], function(Terrain, Craft, Water, M) {
  return function(gl) {
    var terrain = new Terrain(gl);
    var craft = new Craft(terrain);
    var water = new Water(gl);
    
    var projection = M.mat4.create();
    var camera = M.mat4.create();
    var view = M.mat4.create();
    var viewProjection = M.mat4.create();
    var tmp = M.vec3.create();
    
    this.update = function(timeStep, input) {
      craft.update(timeStep, input);
      var at = craft.at;
      var normal = craft.normal;
      var pos = craft.pos;
      M.vec3.cross(tmp, at, normal);
      camera[0] = tmp[0];
      camera[1] = tmp[1];
      camera[2] = tmp[2];
      camera[3] = 0;
      camera[4] = normal[0];
      camera[5] = normal[1];
      camera[6] = normal[2];
      camera[7] = 0;
      camera[8] = -at[0];
      camera[9] = -at[1];
      camera[10] = -at[2];
      camera[11] = 0;
      M.vec3.scaleAndAdd(tmp, pos, normal, 0.2);
      camera[12] = tmp[0];
      camera[13] = tmp[1];
      camera[14] = tmp[2];
      camera[15] = 1;
      M.mat4.invert(view, camera);
    };
    
    this.render = function() {
      M.mat4.perspective(projection, 40 / 128 * Math.PI, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 500);
      
      M.mat4.mul(viewProjection, projection, view);
    
      terrain.render(viewProjection);
      water.render(viewProjection);
    };
  };
});