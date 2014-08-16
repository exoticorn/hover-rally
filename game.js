define(['terrain', 'gl-matrix-min'], function(Terrain, M) {
  return function(gl) {
    var terrain = new Terrain(gl);
    
    var projection = M.mat4.create();
    var camera = M.mat4.create();
    var view = M.mat4.create();
    var viewProjection = M.mat4.create();
    var normal = M.vec3.create();
    var at = M.vec3.create();
    var tmp = M.vec3.create();
    
    var angle = 0;
    
    this.update = function(timeStep) {
      angle += timeStep * 0.04;
      var cx = 128 + Math.sin(angle) * 100;
      var cy = 128 + Math.cos(angle) * 100;
      at[0] = Math.cos(angle);
      at[1] = -Math.sin(angle);
      at[2] = 0;
      terrain.normalAt(normal, cx, cy);
      M.vec3.cross(tmp, at, normal);
      M.vec3.normalize(tmp, tmp);
      M.vec3.cross(at, normal, tmp);
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
      camera[12] = cx;
      camera[13] = cy;
      camera[14] = terrain.heightAt(cx, cy) + 1;
      camera[15] = 1;
      M.mat4.invert(view, camera);
    };
    
    this.render = function() {
      M.mat4.perspective(projection, 40 / 128 * Math.PI, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 500);
      
      M.mat4.mul(viewProjection, projection, view);
    
      terrain.render(viewProjection);
    };
  };
});