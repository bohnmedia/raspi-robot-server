var directionInterval;
const domKeys = [
    [document.querySelector('#controls .up'), 0, 1],
    [document.querySelector('#controls .upright'), 1, 1],
    [document.querySelector('#controls .right'), 1, 0],
    [document.querySelector('#controls .downright'), 1, -1],
    [document.querySelector('#controls .down'), 0, -1],
    [document.querySelector('#controls .downleft'), -1, -1],
    [document.querySelector('#controls .left'), -1, 0],
    [document.querySelector('#controls .upleft'), -1, 1]
];
const activeKeys = [];
const direction = {
    x: 0,
    y: 0
}
const updateDomKeys = function () {

    // HTML-Tasten
    domKeys.forEach(function(domKey){
        if (direction.x === domKey[1] && direction.y === domKey[2]) {
            domKey[0].classList.add('active');
        } else {
            domKey[0].classList.remove('active');
        }
    });
    
}

const updateActiveKeys = function () {

    // Richtungstasten
    const up = (activeKeys.indexOf("ArrowUp") !== -1) ? 1 : 0;
    const right = (activeKeys.indexOf("ArrowRight") !== -1) ? 1 : 0;
    const down = (activeKeys.indexOf("ArrowDown") !== -1) ? 1 : 0;
    const left = (activeKeys.indexOf("ArrowLeft") !== -1) ? 1 : 0;

    // Direction
    direction.x = right - left;
    direction.y = up - down;

    updateKeys();

}

const updateKeys = function () {

    if (directionInterval) window.clearInterval(directionInterval);

    if (direction.x !== 0 || direction.y !== 0) {
        directionInterval = window.setInterval(sendKeys, 100);
    } else {
        directionInterval = null;
    }

    updateDomKeys();
    sendKeys();

}

const sendKeys = function() {
    socket.emit("direction", [direction.x, direction.y]);
}

/* ---------- */
/* KEY EVENTS */
/* ---------- */

window.addEventListener("keydown", function (event) {
    if (activeKeys.indexOf(event.key) !== -1) return;
    activeKeys.push(event.key);
    updateActiveKeys();
});

window.addEventListener("keyup", function (event) {
    const index = activeKeys.indexOf(event.key);
    if (index === -1) return;
    activeKeys.splice(index, 1);
    updateActiveKeys();
});

/* ------------ */
/* MOUSE EVENTS */
/* ------------ */

domKeys.forEach(function(domKey){
    const on = function() {
        direction.x = domKey[1];
        direction.y = domKey[2];
        updateKeys();
    }
    const off = function() {
        direction.x = 0;
        direction.y = 0;
        updateKeys();
    }
    domKey[0].addEventListener("mousedown", on);
    domKey[0].addEventListener("mouseup", off);
    domKey[0].addEventListener("mouseleave", off);
});

