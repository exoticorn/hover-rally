define(['gl-matrix-min'], function(M) {
  return function(terrain) {
    var self = this;
    this.pos = M.vec3.clone([128, 128, terrain.heightAt(128, 128)]);
    this.normal = M.vec3.create();
    terrain.normalAt(this.normal, this.pos[0], this.pos[1]);
    this.at = M.vec3.clone([1, 0, 0]);
    this.movement = M.vec3.create();
    
    function fixAt() {
      var d = M.vec3.dot(self.normal, self.at);
      M.vec3.scaleAndAdd(self.at, self.at, self.normal, -d);
      M.vec3.normalize(self.at, self.at);
    }
    
    fixAt();
    
    var v1 = M.vec3.create();
    var v2 = M.vec3.create();
    var v3 = M.vec3.create();
    var m3 = M.mat3.create();
    
    this.update = function(timeStep, input) {
      this.movement[2] -= timeStep * 10;
      M.vec3.scaleAndAdd(this.pos, this.pos, this.movement, timeStep);
      var groundPos = v1;
      groundPos[0] = this.pos[0];
      groundPos[1] = this.pos[1];
      groundPos[2] = terrain.heightAt(groundPos[0], groundPos[1]);
      var groundNormal = v2;
      terrain.normalAt(groundNormal, groundPos[0], groundPos[1]);
      var delta = v3;
      M.vec3.sub(delta, this.pos, groundPos);
      var distance = M.vec3.dot(delta, groundNormal);
      var onGround = distance <= 0;
      if(onGround) {
        M.vec3.scaleAndAdd(this.pos, this.pos, groundNormal, -distance);
        var d = M.vec3.dot(this.movement, groundNormal);
        if(d < 0) {
          M.vec3.scaleAndAdd(this.movement, this.movement, groundNormal, -d);
        }
        M.vec3.copy(this.normal, groundNormal);
      }

      var right = v1;
      M.vec3.cross(right, this.at, this.normal);
      var turn = 0;
      if(input.left) turn -= 0.1;
      if(input.right) turn += 0.1;
      if(turn !== 0) {
        M.vec3.scaleAndAdd(this.at, this.at, right, turn * timeStep * 10);
      }
      fixAt();
      
      if(onGround) {
        var rightMovement = M.vec3.dot(right, this.movement);
        M.vec3.scaleAndAdd(this.movement, this.movement, right, rightMovement * timeStep * -5);
      }
      
      if(onGround && input.up) {
        M.vec3.scaleAndAdd(this.movement, this.movement, this.at, timeStep * 10);
      }
      
    };
  };
});