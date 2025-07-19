const state = {
    current: "unfocused",
    tool: "line",
    scale: 1,
    selectedElement: null,
    elements: []
};

const setState = (newState) => { state.current = newState; };
const getState = () => state.current;
const setTool = (tool) => { state.tool = tool; };
const getTool = () => state.tool;
const setScale = (scale) => { state.scale = scale; };
const getScale = () => state.scale;
const setSelectedElement = (element) => { state.selectedElement = element; };
const getSelectedElement = () => state.selectedElement;
const getElements = () => state.elements;

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
function isWithinElement(x, y, element) {
    const { x1, y1, x2, y2 } = element.coordinates;
    const { type } = element.properties;
    switch (type) {
        case "rectangle":
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        case "line":
            const a = { x: x1, y: y1 };
            const b = { x: x2, y: y2 };
            const c = { x, y };
            const offset = distance(a, b) - (distance(a, c) + distance(b, c));
            return Math.abs(offset) < 1;
        default:
            console.log(`Неизвестный тип: ${type}`);
            break;
    }
}
const getElementAtPosition = (x, y, elements) => elements.find((element) => isWithinElement(x, y, element));

const enableCanvas = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    // ---

    document.getElementById("selection").onchange = () => { setTool("selection"); };
    document.getElementById("line").onchange = () => { setTool("line"); };
    document.getElementById("rectangle").onchange = () => { setTool("rectangle"); };

    // ---

    function drawElement(element) {
        context.beginPath();
        const coordinates = element.coordinates;
        const properties = element.properties;
        switch (properties.type) {
            case "line":
                context.moveTo(coordinates.x1, coordinates.y1);
                context.lineTo(coordinates.x2, coordinates.y2);
                break;
            case "rectangle":
                const width = coordinates.x2 - coordinates.x1;
                const height = coordinates.y2 - coordinates.y1;
                context.rect(coordinates.x1, coordinates.y1, width, height);
                break;
            default:
                console.log(`Неизвестный тип: ${properties.type}`);
                break;
        }
        // context.strokeStyle = properties.strokeStyle;
        // context.lineWidth = properties.lineWidth;
        context.stroke();
    }

    function createElement(coordinates, properties) {
        getElements().push({ coordinates, properties });
    }

    function updateCanvas() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);
        getElements().forEach((element) => { drawElement(element); });
    }

    // ---

    window.addEventListener("resize", (event) => { updateCanvas(); });
    updateCanvas();

    canvas.addEventListener("mousedown", (event) => {
        const { clientX, clientY } = event;
        if (getTool() == "selection") {
            const element = getElementAtPosition(clientX, clientY, getElements());
            if (element) {
                element.offset = {
                    x: clientX - element.coordinates.x1,
                    y: clientY - element.coordinates.y1
                };
                setSelectedElement(element);
                setState("moving");
            }
        } else {
            createElement({
                x1: clientX,
                y1: clientY,
                x2: null,
                y2: null
            }, {
                type: getTool()
            });
            setState("drawing");
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        const { clientX, clientY } = event;
        if (getTool() == "selection") {
            event.target.style.cursor = getElementAtPosition(clientX, clientY, getElements()) ? "move" : "default";
        }
        if (getState() == "moving") {
            const element = getSelectedElement();
            const coordinates = element.coordinates;
            const offset = element.offset;
            const width = coordinates.x2 - coordinates.x1;
            const height = coordinates.y2 - coordinates.y1;

            coordinates.x1 = clientX - offset.x;
            coordinates.y1 = clientY - offset.y;
            coordinates.x2 = clientX - offset.x + width;
            coordinates.y2 = clientY - offset.y + height;
        } else if (getState() == "drawing") {
            const element = getElements().at(-1);
            switch (element.properties.type) {
                case "line":
                case "rectangle":
                    element.coordinates.x2 = clientX;
                    element.coordinates.y2 = clientY;
                    break;
                default:
                    console.log(`Неизвестный тип: ${element.properties.type}`)
                    break;
            }
        }
        updateCanvas();
    });

    canvas.addEventListener("mouseup", (event) => {
        setState("unfocused");
        setSelectedElement(null);
    });
};

document.addEventListener("DOMContentLoaded", enableCanvas);