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
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  var game = new Game(gl);
  
  var isPaused = false;
  var isRequesting = false;
  
  function requestFrame() {
    if(!isRequesting && !isPaused) {
      isRequesting = true;
      window.requestAnimationFrame(mainLoop);
    }
  }
  
  function keyDown(e) {
    if(e.keyCode === 80) {
      isPaused = !isPaused;
      requestFrame();
      e.preventDefault();
    }
  }
  
  function keyUp(e) {
    
  }
  
  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);

  var lastTime = Date.now();
  function mainLoop() {
    isRequesting = false;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var now = Date.now();
    var timeStep = Math.min(0.2, (now - lastTime) / 1000);
    lastTime = now;
    game.update(timeStep);
    game.render();
    requestFrame();
  }
  requestFrame();
});