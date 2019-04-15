# LeapMotion-Battleship

To use it, first connext your Leap Motion device to your computer and finish the envioronment configuration.

This is a web-based Battleship Game (<https://en.wikipedia.org/wiki/Battleship_(game)>) , but the command will be delivered using the Leap Motion hand-gesture.

Basic Usage:

1. Connect Leap Motion and allow the microspeaker to work on your computer.
2. Deploy two ship on the grid game interface. Similar to how we grasp and put down an object in the real world, the Leap Motion will detect your hand's gesture. After deploy, use voice control by speaking **"Start"**, and the game will begin.
3. In your turn, use your finger to indicate a certain grid and speak **"Fire"**, then it will return a voice result of whether you hit the CPU's ship or not.
4. Keep playing like this until one side win.
5. Speak **"I Surrender"** to declare failure.

Detailed codes in app/main.js


![demo](https://github.com/rymaspic/LeapMotion-Battleship/blob/master/img/demo.png)
