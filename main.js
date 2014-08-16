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
  gl.clearColor(0.6, 0.6, 1, 1);
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
  
  var input = { left: false, right: false, up: false, down: false };
  
  function onKey(e) {
    var pressed = e.type === 'keydown';
    if(e.keyCode === 80 && pressed) {
      isPaused = !isPaused;
      requestFrame();
      e.preventDefault();
    }
    if(e.keyCode === 90) { input.left = pressed; e.preventDefault(); }
    if(e.keyCode === 88) { input.right = pressed; e.preventDefault(); }
    if(e.keyCode === 76) { input.up = pressed; e.preventDefault(); }
  }
  
  document.addEventListener('keydown', onKey, false);
  document.addEventListener('keyup', onKey, false);

  var lastTime = Date.now();
  function mainLoop() {
    isRequesting = false;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var now = Date.now();
    var timeStep = Math.min(0.2, (now - lastTime) / 1000);
    lastTime = now;
    game.update(timeStep, input);
    game.render();
    requestFrame();
  }
  requestFrame();
});