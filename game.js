define(['terrain', 'craft', 'water', 'beacon', 'gl-matrix-min'], function(Terrain, Craft, Water, Beacon, M) {
  return function(gl) {
    var terrain = new Terrain(gl);
    var craft = new Craft(terrain);
    var water = new Water(gl);
    var beacon = new Beacon(gl);
    
    var waypoints = [];
    var waypointCandidates = [];
    for(var i = 0; i < 100; ++i) {
      var candidate = {
        x: Math.random() * 255,
        y: Math.random() * 255,
      };
      candidate.z = terrain.heightAt(candidate.x, candidate.y);
      candidate.score = Math.random() * (candidate.z === 0 ? 40 : candidate.z);
      waypointCandidates.push(candidate);
    }
    waypointCandidates = waypointCandidates.sort(function(a, b) {
      return a.score - b.score;
    });
    var w;
    for(i = 0; i < 10; ++i) {
      w = waypointCandidates[i];
      waypoints.push([w.x, w.y, w.z]);
    }
    w = waypointCandidates[20];
    craft.pos[0] = w.x;
    craft.pos[1] = w.y;
    craft.pos[2] = w.z;
    
    var projection = M.mat4.create();
    var camera = M.mat4.create();
    var cameraPos = M.vec3.create();
    var view = M.mat4.create();
    var viewProjection = M.mat4.create();
    var tmp = M.vec3.create();
    
    var time = 0;
    
    this.update = function(timeStep, input) {
      time += timeStep;
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
      M.vec3.scaleAndAdd(cameraPos, pos, normal, 0.2);
      camera[12] = cameraPos[0];
      camera[13] = cameraPos[1];
      camera[14] = cameraPos[2];
      camera[15] = 1;
      M.mat4.invert(view, camera);
      
      for(var i = 0; i < waypoints.length; ++i) {
        M.vec3.sub(tmp, waypoints[i], pos);
        if(M.vec2.length(tmp) <= 1.5) {
          waypoints.splice(i, 1);
          break;
        }
      }
    };
    
    this.render = function() {
      M.mat4.perspective(projection, 40 / 128 * Math.PI, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 500);
      
      M.mat4.mul(viewProjection, projection, view);
    
      terrain.render(viewProjection, cameraPos);
      water.render(viewProjection);
      
      for(var i = 0; i < waypoints.length; ++i) {
        beacon.render(viewProjection, cameraPos, waypoints[i], time);
      }
    };
  };
});