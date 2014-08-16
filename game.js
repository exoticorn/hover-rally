define(['terrain'], function(Terrain) {
  return function(gl) {
    var terrain = new Terrain(gl);
    
    this.render = function() {
      terrain.render();
    };
  };
});