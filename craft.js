define(['gl-matrix-min'], function(M) {
  return function(terrain) {
    var self = this;
    this.pos = M.vec3.clone([128, 128, terrain.heightAt(128, 128)]);
    this.normal = M.vec3.create();
    terrain.normalAt(this.normal, this.pos[0], this.pos[1]);
    this.at = M.vec3.clone([1, 0, 0]);
    this.movement = M.vec3.create();
    this.normalMovement = M.vec3.create();
    
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
      var onWater = onGround && groundPos[2] === 0;
      if(onGround) {
        M.vec3.scaleAndAdd(this.pos, this.pos, groundNormal, -distance);
        var d = M.vec3.dot(this.movement, groundNormal);
        if(d < 0) {
          M.vec3.scaleAndAdd(this.movement, this.movement, groundNormal, -d);
          M.vec3.sub(delta, groundNormal, this.normal);
          M.vec3.scaleAndAdd(this.normalMovement, this.normalMovement, delta, Math.min(2, d * -5));
        }
      }
      
      M.vec3.scaleAndAdd(this.normal, this.normal, this.normalMovement, timeStep);
      M.vec3.normalize(this.normal, this.normal);
      M.vec3.scale(this.normalMovement, this.normalMovement, 1 - timeStep * 2);

      var right = v1;
      M.vec3.cross(right, this.at, this.normal);
      if(input.left || input.right) {
        M.vec3.cross(v2, this.movement, this.normal);
        var l = M.vec3.length(v2);
        var turn = input.left ? -1 : 1;
        var s = Math.abs(l) > 0.001 ? Math.atan(l * 1.5) / 1.5 / l : 0;
        M.vec3.scaleAndAdd(this.at, this.at, v2, turn * timeStep * s);
      }
      fixAt();
      
      if(onGround) {
        var factor = onWater ? 0.35 : 1;
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
          if(targetSpeed * speed < 0) {
            force *= 4;
          }
          M.vec3.scaleAndAdd(this.movement, this.movement, this.at, timeStep * force * factor);
        }
      }
      
    };
  };
});