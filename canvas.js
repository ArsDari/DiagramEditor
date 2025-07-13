document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    document.oncontextmenu = () => {
        return false;
    };

    const drawings = [];

    let cursorX;
    let cursorY;
    let prevCursorX;
    let prevCursorY;

    let offsetX = 0;
    let offsetY = 0;

    let scale = 1;

    function toScreenX(xTrue) {
        return (xTrue + offsetX) * scale;
    }

    function toScreenY(yTrue) {
        return (yTrue + offsetY) * scale;
    }

    function toTrueX(xScreen) {
        return (xScreen / scale) - offsetX;
    }

    function toTrueY(yScreen) {
        return (yScreen / scale) - offsetY;
    }

    function trueHeight() {
        return canvas.clientHeight / scale;
    }

    function trueWidth() {
        return canvas.clientWidth / scale;
    }

    function redrawCanvas() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;

        context.fillStyle = '#FFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < drawings.length; i++) {
            const line = drawings[i];
            drawLine(toScreenX(line.x0), toScreenY(line.y0), toScreenX(line.x1), toScreenY(line.y1));
        }
    }

    redrawCanvas();

    window.addEventListener("resize", (event) => {
        redrawCanvas();
    });

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('wheel', onMouseWheel, false);

    let leftMouseDown = false;
    let rightMouseDown = false;

    function onMouseDown(event) {
        if (event.button == 0) {
            leftMouseDown = true;
            rightMouseDown = false;
        }

        if (event.button == 2) {
            rightMouseDown = true;
            leftMouseDown = false;
        }

        cursorX = event.pageX;
        cursorY = event.pageY;
        prevCursorX = event.pageX;
        prevCursorY = event.pageY;
    }

    function onMouseMove(event) {
        cursorX = event.pageX;
        cursorY = event.pageY;
        const scaledX = toTrueX(cursorX);
        const scaledY = toTrueY(cursorY);
        const prevScaledX = toTrueX(prevCursorX);
        const prevScaledY = toTrueY(prevCursorY);

        if (leftMouseDown) {
            drawings.push({
                x0: prevScaledX,
                y0: prevScaledY,
                x1: scaledX,
                y1: scaledY
            });
            drawLine(prevCursorX, prevCursorY, cursorX, cursorY);
        }

        if (rightMouseDown) {
            offsetX += (cursorX - prevCursorX) / scale;
            offsetY += (cursorY - prevCursorY) / scale;
            redrawCanvas();
        }
        
        prevCursorX = cursorX;
        prevCursorY = cursorY;
    }

    function onMouseUp() {
        leftMouseDown = false;
        rightMouseDown = false;
    }

    function onMouseWheel(event) {
        const deltaY = event.deltaY;
        const scaleAmount = -deltaY / 500;
        scale = scale * (1 + scaleAmount);

        var distX = event.pageX / canvas.clientWidth;
        var distY = event.pageY / canvas.clientHeight;

        const unitsZoomedX = trueWidth() * scaleAmount;
        const unitsZoomedY = trueHeight() * scaleAmount;

        const unitsAddLeft = unitsZoomedX * distX;
        const unitsAddTop = unitsZoomedY * distY;

        offsetX -= unitsAddLeft;
        offsetY -= unitsAddTop;

        redrawCanvas();
    }

    function drawLine(x0, y0, x1, y1) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = '#000';
        context.lineWidth = 2;
        context.stroke();
    }
});