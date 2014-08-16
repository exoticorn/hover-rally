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
      this.movement[2] -= timeStep * 2;
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
      var onWater = false;
      if(this.pos[2] < 0 && (!onGround || groundPos[2] < 0)) {
        onWater = true;
        onGround = true;
        distance = this.pos[2];
        groundNormal[0] = 0;
        groundNormal[1] = 0;
        groundNormal[2] = 1;
      }
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
        var factor = onWater ? 0.2 : 1;
        var rightMovement = M.vec3.dot(right, this.movement);
        var rightAmount = 0;
        if(rightMovement > 0) {
          rightAmount = Math.max(-rightMovement, -timeStep * 3 * factor);
        } else {
          rightAmount = Math.min(-rightMovement, timeStep * 3 * factor);
        }
        M.vec3.scaleAndAdd(this.movement, this.movement, right, rightAmount);
        var speed = M.vec3.dot(this.movement, this.at);
        var targetSpeed;
        if(input.up) {
          targetSpeed = 7;
        }
        if(input.down) {
          targetSpeed = -3;
        }
        
        if(targetSpeed) {
          var force = Math.max(-1, Math.min(1, (targetSpeed - speed) * 0.5));
          M.vec3.scaleAndAdd(this.movement, this.movement, this.at, timeStep * force * factor);
        }
      }
      
    };
  };
});