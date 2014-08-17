define(['terrain', 'craft', 'water', 'beacon', 'gl-matrix-min'], function(Terrain, Craft, Water, Beacon, M) {
  return function(gl) {
    var terrain = new Terrain(gl);
    var craft = new Craft(terrain);
    var water = new Water(gl);
    var beacon = new Beacon(gl);
    
    var waypoints = [];
    var waypointCandidates = [];
    for(var i = 0; i < 100; ++i) {
      var x = 16 + Math.random() * 224;
      var y = 16 + Math.random() * 224;
      var z = terrain.heightAt(x, y);
      var candidate = {
        pos: [x, y, z],
        baseScore: Math.random() * (z === 0 ? 40 : z)
      };
      waypointCandidates.push(candidate);
    }
    var w;
    var tmp = M.vec3.create();
    var cmpCandidates = function(a, b) {
      return a.score - b.score;
    };
    while(waypoints.length < 20) {
      for(i = 0; i < waypointCandidates.length; ++i) {
        w = waypointCandidates[i];
        var p = w.pos;
        var score = w.baseScore;
        for(var j = 0; j < waypoints.length; ++j) {
          M.vec3.sub(tmp, p, waypoints[j]);
          score /= Math.sqrt(M.vec3.length(tmp));
        }
        w.score = score;
      }
      waypointCandidates = waypointCandidates.sort(cmpCandidates);
      waypoints.push(waypointCandidates.shift().pos);
    }
    w = waypointCandidates[20];
    M.vec3.copy(craft.pos, waypointCandidates.shift().pos);

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
        if(M.vec2.length(tmp) <= 2) {
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