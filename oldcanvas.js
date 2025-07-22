/*

const history = {
    elements: [],
    index: 0
};

const addStepToHistory = (action) => {
    const nextStep = typeof (action) == "function" ? action(history.elements[index]) : action;
    history.elements.push(nextStep);
    history.index++;
};
const undo = () => {
    if (history.index > 0) {
        history.index--;
    }
};
const redo = () => {
};

*/

/*

element = {
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: string,
    ...: ...
};

*/



/*





 */

const enableCanvas = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    document.getElementById("selection").onchange = () => setTool("selection");
    document.getElementById("line").onchange = () => setTool("line");
    document.getElementById("rectangle").onchange = () => setTool("rectangle");

    // ---

    function drawElement(element) {
        const { x1, y1, x2, y2, type } = element;
        context.save();
        context.beginPath();
        switch (type) {
            case "line": {
                context.moveTo(x1, y1);
                context.lineTo(x2, y2);
                break;
            }
            case "rectangle": {
                const width = x2 - x1;
                const height = y2 - y1;
                context.rect(x1, y1, width, height);
                break;
            }
            default:
                console.warn(`Неизвестный тип: ${type}`);
                break;
        }
        // context.strokeStyle = properties.strokeStyle;
        // context.lineWidth = properties.lineWidth;
        context.stroke();
        context.restore();
    }

    function updateCanvas() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);
        const scale = getScale();
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        const scaledOffset = {
            x: (scaledWidth - canvas.width) / 2, // поменять двойки на значения мыши
            y: (scaledHeight - canvas.height) / 2
        };
        setScaledOffset(scaledOffset);
        const panOffset = getPanOffset(); // смещение холста
        context.save();
        context.translate(
            panOffset.x * scale - scaledOffset.x,
            panOffset.y * scale - scaledOffset.y
        );
        context.scale(scale, scale);
        getElements().forEach(element => drawElement(element));
        context.restore();
    }

    updateCanvas();

    // ---

    window.addEventListener("resize", event => updateCanvas());

    canvas.addEventListener("mousedown", event => {
        const { clientX, clientY } = getMouseCoordinates(event);
        const tool = getTool();
        if (event.button == 1) {
            if (getPressedKeys().size == 0) {
                setState("panning");
                setMouseOffset({ x: clientX, y: clientY });
            }
            return;
        }
        switch (tool) {
            case "selection": {
                const element = getElementAtPosition(clientX, clientY, getElements());
                if (element) {
                    element.mouseOffset.x = clientX - element.x1;
                    element.mouseOffset.y = clientY - element.y1;
                    setSelectedElementId(element.id);
                    if (element.mousePosition == "inside") {
                        setState("moving");
                    } else {
                        setState("resizing");
                    }
                }
                break;
            }
            case "line":
            case "rectangle": {
                createElement({
                    id: getNewElementId(),
                    x1: clientX,
                    y1: clientY,
                    x2: clientX,
                    y2: clientY,
                    type: tool,
                    mousePosition: null,
                    mouseOffset: { x: 0, y: 0 }
                });
                setSelectedElementId(getLastElement().id);
                setState("drawing");
                break;
            }
            default:
                console.warn(`Неизвестный аргумент: ${tool}`);
                break;
        }
    });

    

    

    

    
};

document.addEventListener("DOMContentLoaded", enableCanvas);