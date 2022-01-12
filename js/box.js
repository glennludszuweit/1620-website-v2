let gIsDrugging = false;
let gGap = 1;
let step = 0.2;
let gIsShrink = false;
let interval;

function onMouseDown() {
  console.log("mouse down");
  document.querySelector(".box").classList.add("off");
  gIsDrugging = true;
}

function onMouseUp() {
  console.log("mouse up");
  document.querySelector(".box").classList.remove("off");
  gIsDrugging = false;
}

function onMouseMove(ev) {
  if (!gIsDrugging) return;
  //   const elBox = document.querySelector(".box");
  const { movementX, movementY } = ev;
  const nextPosition = {
    x: +getValue("--rotatex").replace("deg", "") + movementY * -1 || 0,
    y: +getValue("--rotatey").replace("deg", "") + movementX || 0,
  };
  setValue("--rotatex", nextPosition.x + "deg");
  setValue("--rotatey", nextPosition.y + "deg");
}

function animateFace() {
  interval = setInterval(() => {
    gGap = gIsShrink ? gGap + step : gGap - step;
    setValue("--gap", gGap + "px");
    if (gGap > 75 || gGap < 1) gIsShrink = !gIsShrink;
  }, 1);
}

function stopAminateFace() {
  clearInterval(interval);
}

function getValue(varName) {
  const elBox = document.querySelector(":root");
  var boxStyle = getComputedStyle(elBox);
  return boxStyle.getPropertyValue(varName);
}

function setValue(varName, value) {
  const elBox = document.querySelector(":root");
  elBox.style.setProperty(varName, value);
}
