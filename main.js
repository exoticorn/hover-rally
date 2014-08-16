"use strict";

require(['game'], function(Game) {
  var screen = document.getElementById('screen');

  function resizeScreen() {
    screen.width = window.innerWidth;
    screen.height = window.innerHeight;
  }

  resizeScreen();
  window.addEventListener('resize', resizeScreen, false);

  var gl = screen.getContext('webgl', {alpha: false});
  gl.clearColor(0, 1, 0, 1);
  var game = new Game(gl);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  game.render();
});