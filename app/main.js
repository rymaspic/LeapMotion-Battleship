// GAME SETUP
var initialState = SKIPSETUP ? "playing" : "setup";
var gameState = new GameState({state: initialState});
var cpuBoard = new Board({autoDeploy: true, name: "cpu"});
var playerBoard = new Board({autoDeploy: SKIPSETUP, name: "player"});
var cursor = new Cursor();

// UI SETUP
setupUserInterface();

// selectedTile: The tile that the player is currently hovering above
var selectedTile = false;

// grabbedShip/Offset: The ship and offset if player is currently manipulating a ship
var grabbedShip = false;
var grabbedOffset = [0, 0];

// isGrabbing: Is the player's hand currently in a grabbing pose
var isGrabbing = false;

// MAIN GAME LOOP
// Called every time the Leap provides a new frame of data
Leap.loop({ hand: function(hand) {
  // Clear any highlighting at the beginning of the loop
  unhighlightTiles();

  // TODO: 4.1, Moving the cursor with Leap data
  // Use the hand data to control the cursor's screen position
  var handPosition = hand.screenPosition();
  var y_offset = 200;
  var cursorPosition = [handPosition[0], handPosition[1]+y_offset];
  cursor.setScreenPosition(cursorPosition);

  // TODO: 4.1
  // Get the tile that the player is currently selecting, and highlight it
  //selectedTile = ?

  selectedTile = getIntersectingTile(cursorPosition);
  //  highlightTile(selectedTile)
  if (selectedTile){
    highlightTile(selectedTile, Colors['RED']);
    }

  // SETUP mode
  if (gameState.get('state') == 'setup') {
    background.setContent("<h1>battleship</h1><h3 style='color: #7CD3A2;'>deploy ships</h3>");
    // TODO: 4.2, Deploying ships
    //  Enable the player to grab, move, rotate, and drop ships to deploy them

    // First, determine if grabbing pose or not
    isGrabbing = false;
    var thresholdStrength = 0.5;
    var thresholdPinth = 0.5;
    console.log("grabStrength:");
    console.log(hand.grabStrength);
    console.log("pinchStrength:");
    console.log(hand.pinchStrength);
    if (hand.grabStrength > thresholdStrength && hand.pinchStrength > thresholdPinth) {
        isGrabbing = true;
    }
    
    console.log("isGrabbing:");
    console.log(isGrabbing);

    // Grabbing, but no selected ship yet. Look for one.
    // TODO: Update grabbedShip/grabbedOffset if the user is hovering over a ship
    if (!grabbedShip && isGrabbing) {
        grabbedShipAndOffset = getIntersectingShipAndOffset(cursorPosition);
        if (grabbedShipAndOffset !== false) {
            grabbedOffset = grabbedShipAndOffset.offset;
            grabbedShip = grabbedShipAndOffset.ship;
        }
    }

    // Has selected a ship and is still holding it
    // TODO: Move the ship
    else if (grabbedShip && isGrabbing) {
      grabbedShip.setScreenPosition([cursorPosition[0] - grabbedOffset[0], cursorPosition[1] - grabbedOffset[1]]);
      grabbedShip.setScreenRotation(-hand.roll());
    //      grabbedShip.setScreenPosition([0,0]);
    //      grabbedShip.setScreenRotation(0);
    }

    // Finished moving a ship. Release it, and try placing it.
    // TODO: Try placing the ship on the board and release the ship
    else if (grabbedShip && !isGrabbing) {
      console.log("Successfully placed the ship!");
      placeShip(grabbedShip);
      grabbedShip = false;
      //window.speechSynthesis.speak("You Are Ready for Fight!");
        
    }
  }

  // PLAYING or END GAME so draw the board and ships (if player's board)
  // Note: Don't have to touch this code
  else {
    if (gameState.get('state') == 'playing') {
      background.setContent("<h1>battleship</h1><h3 style='color: #7CD3A2;'>game on</h3>");
      turnFeedback.setContent(gameState.getTurnHTML());
    }
    else if (gameState.get('state') == 'end') {
      var endLabel = gameState.get('winner') == 'player' ? 'you won!' : 'game over';
      background.setContent("<h1>battleship</h1><h3 style='color: #7CD3A2;'>"+endLabel+"</h3>");
      turnFeedback.setContent("");
    }

    var board = gameState.get('turn') == 'player' ? cpuBoard : playerBoard;
    // Render past shots
    board.get('shots').forEach(function(shot) {
      var position = shot.get('position');
      var tileColor = shot.get('isHit') ? Colors.RED : Colors.YELLOW;
      highlightTile(position, tileColor);
    });

    // Render the ships
    playerBoard.get('ships').forEach(function(ship) {
      if (gameState.get('turn') == 'cpu') {
        var position = ship.get('position');
        var screenPosition = gridOrigin.slice(0);
        screenPosition[0] += position.col * TILESIZE;
        screenPosition[1] += position.row * TILESIZE;
        ship.setScreenPosition(screenPosition);
        if (ship.get('isVertical'))
          ship.setScreenRotation(Math.PI/2);
      } else {
        ship.setScreenPosition([-500, -500]);
      }
    });

    // If playing and CPU's turn, generate a shot
    if (gameState.get('state') == 'playing' && gameState.isCpuTurn() && !gameState.get('waiting')) {
      gameState.set('waiting', true);
      generateCpuShot();
    }
  }
}}).use('screenPosition', {scale: LEAPSCALE});

// processSpeech(transcript)
//  Is called anytime speech is recognized by the Web Speech API
// Input: 
//    transcript, a string of possibly multiple words that were recognized
// Output: 
//    processed, a boolean indicating whether the system reacted to the speech or not
var processSpeech = function(transcript) {
  // Helper function to detect if any commands appear in a string
  var userSaid = function(str, commands) {
    for (var i = 0; i < commands.length; i++) {
      if (str.indexOf(commands[i]) > -1)
        return true;
    }
    return false;
  };

  var processed = false;
  if (gameState.get('state') == 'setup') {
    // TODO: 4.3, Starting the game with speech
    // Detect the 'start' command, and start the game if it was said
    if (userSaid(transcript, ['start'])) {
      gameState.startGame();
      generateSpeech("Fight or die!")
      processed = true;
    }
  }

  else if (gameState.get('state') == 'playing') {
    if (gameState.isPlayerTurn()) {
      // TODO: 4.4, Player's turn
      // Detect the 'fire' command, and register the shot if it was said
      if (userSaid(transcript, ['fire'])) {
        registerPlayerShot();
        processed = true;
      }
      else if (userSaid(transcript, ['surrender','goodbye'])){
        generateSpeech("Goodbye!");
        gameState.endGame("cpu");
        processed = true;
      }
    }

    else if (gameState.isCpuTurn() && gameState.waitingForPlayer()) {
      // TODO: 4.5, CPU's turn
      // Detect the player's response to the CPU's shot: hit, miss, you sunk my ..., game over
      // and register the CPU's shot if it was said
      var PlayerRes = userSaid(transcript.toLowerCase(), ['hit','miss','sunk','game over']);
      if (PlayerRes) {
        //var response = transcript;
          
//        console.log("transcript:");
//        console.log(transcript);
        var res = transcript;
        console.log("res:");
        console.log(res);
        registerCpuShot(res);
        processed = true;
      }
    }
  }

  return processed;
};

// TODO: 4.4, Player's turn
// Generate CPU speech feedback when player takes a shot
var HitCount = 0;
var registerPlayerShot = function() {
  // TODO: CPU should respond if the shot was off-board
  if (!selectedTile) {
       generateSpeech("off-board");
  }

  // If aiming at a tile, register the player's shot
  else {
    var shot = new Shot({position: selectedTile});
    var result = cpuBoard.fireShot(shot);

    // Duplicate shot
    if (!result) return;

    // TODO: Generate CPU feedback in three cases
    // Game over
    if (result.isGameOver) {
      generateSpeech("You Win, brave man!");
      gameState.endGame("player");
      return;
    }
    // Sunk ship
    else if (result.sunkShip) {
      var shipName = result.sunkShip.get('type');
      generateSpeech("You sunk my" + shipName);
      HitCount = HitCount + 1;
      //console.log("You Hit Me")
      if (HitCount >= 2){
         generateSpeech("You are on fire!");
      }
    }
    // Hit or miss
    else {
      var isHit = result.shot.get('isHit');
        if (isHit){
            generateSpeech("You Hit Me!");
            HitCount = HitCount + 1;
            //console.log("You Hit Me")
            if (HitCount >= 2){
                generateSpeech("You are on fire!");
            }
        } else {
            generateSpeech("Aha, it's impossible!");
            HitCount = 0;
        }
    }

    if (!result.isGameOver) {
      // TODO: Uncomment nextTurn to move onto the CPU's turn
      nextTurn();
    }
  }
};

// TODO: 4.5, CPU's turn
// Generate CPU shot as speech and blinking
var cpuShot;
var generateCpuShot = function() {
  // Generate a random CPU shot
  cpuShot = gameState.getCpuShot();
  var tile = cpuShot.get('position');
  var rowName = ROWNAMES[tile.row]; // e.g. "A"
  var colName = COLNAMES[tile.col]; // e.g. "5"

  // TODO: Generate speech and visual cues for CPU shot
  generateSpeech("target the " + rowName + " " + colName);
  blinkTile(tile);
    
    
};

// TODO: 4.5, CPU's turn
// Generate CPU speech in response to the player's response
// E.g. CPU takes shot, then player responds with "hit" ==> CPU could then say "AWESOME!"



var registerCpuShot = function(playerResponse) {
  // Cancel any blinking
  unblinkTiles();
  var result = playerBoard.fireShot(cpuShot);

  // NOTE: Here we are using the actual result of the shot, rather than the player's response
  // In 4.6, you may experiment with the CPU's response when the player is not being truthful!

  // TODO: Generate CPU feedback in three cases
  // Game over
  if (result.isGameOver) {
    generateSpeech("I win!");
    gameState.endGame("cpu");
    return;
  }
  // Sunk ship
  else if (result.sunkShip) {
    var shipName = result.sunkShip.get('type');
    generateSpeech("Your" + shipName + "is suck!");
  }
  // Hit or miss
  else {
    var isHit = result.shot.get('isHit');
      if (isHit){
          console.log("P response:");
          //console.log(playerResponse.type);
          console.log(playerResponse.valueOf() == "Miss");
          console.log(playerResponse.toLowerCase() == "miss");
          if (playerResponse.toLowerCase() == "miss"){
              generateSpeech("Don not stupidly think I don't know your little tricks!");
          } else {
              generateSpeech("Awesome!");
          }
      } 
      else{
          generateSpeech("You are lucky! But only this time!");
      }

  }

  if (!result.isGameOver) {
    // TODO: Uncomment nextTurn to move onto the player's next turn
    nextTurn();
  }
};

