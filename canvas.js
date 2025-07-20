const state = {
    current: "unfocused",
    tool: "selection",
    scale: 1,
    scaledOffset: { x: 0, y: 0 },
    panOffset: { x: 0, y: 0 },
    mouseOffset: { x: 0, y: 0 },
    selectedElement: null,
    elements: [],
    pressedKeys: new Set()
};

const setState = (newState) => { state.current = newState; };
const getState = () => state.current;
const setTool = (tool) => { state.tool = tool; };
const getTool = () => state.tool;
const setScale = (scale) => { state.scale = scale; };
const getScale = () => state.scale;
const setScaledOffset = (offset) => { state.scaledOffset = offset };
const getScaledOffset = () => state.scaledOffset;
const setPanOffset = (offset) => { state.panOffset = offset };
const getPanOffset = () => state.panOffset;
const setMouseOffset = (offset) => { state.mouseOffset = offset };
const getMouseOffset = () => state.mouseOffset;
const setSelectedElement = (element) => { state.selectedElement = element; };
const getSelectedElement = () => state.selectedElement;
const getElements = () => state.elements;
const getLastElement = () => state.elements.at(-1);
const getPressedKeys = () => state.pressedKeys;

// const history = {
//     elements: [],
//     index: 0
// };

// const addStepToHistory = (action) => {
//     const nextStep = typeof (action) == "function" ? action(history.elements[index]) : action;
//     history.elements.push(nextStep);
//     history.index++;
// };
// const undo = () => {
//     if (history.index > 0) {
//         history.index--;
//     }
// };

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
const nearPoint = (x, y, x1, y1) => {
    return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5;
};
function positionWithinElement(x, y, element) {
    const { x1, y1, x2, y2 } = element.coordinates;
    const { type } = element.properties;
    switch (type) {
        case "rectangle": {
            const topLeft = nearPoint(x, y, x1, y1) ? "tl" : null;
            const topRight = nearPoint(x, y, x2, y1) ? "tr" : null;
            const bottomLeft = nearPoint(x, y, x1, y2) ? "bl" : null;
            const bottomRight = nearPoint(x, y, x2, y2) ? "br" : null;
            const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
            return topLeft || topRight || bottomLeft || bottomRight || inside;
        }
        case "line": {
            const a = { x: x1, y: y1 };
            const b = { x: x2, y: y2 };
            const c = { x, y };
            const offset = distance(a, b) - (distance(a, c) + distance(b, c));
            const start = nearPoint(x, y, x1, y1) ? "start" : null;
            const end = nearPoint(x, y, x2, y2) ? "end" : null;
            const inside = Math.abs(offset) < 1 ? "inside" : null;
            return start || end || inside;
        }
        default:
            console.warn(`Неизвестный тип: ${type}`);
            break;
    }
}
const getElementAtPosition = (x, y, elements) => {
    return elements
        .map((element) => ({ ...element, position: positionWithinElement(x, y, element) }))
        .find((element) => element.position != null);
};
const adjustCoordinates = (element) => {
    const { coordinates, properties } = element;
    const { x1, y1, x2, y2 } = coordinates;
    const { type } = properties;
    switch (type) {
        case "rectangle":
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            return { x1: minX, y1: minY, x2: maxX, y2: maxY };
        case "line":
            if (x1 < x2 || (x1 == x2 && y1 < y2)) {
                return { x1: x1, y1: y1, x2: x2, y2: y2 };
            } else {
                return { x1: x2, y1: y2, x2: x1, y2: y1 };
            }
        default:
            break;
    }
};
const cursorAtPosition = (position) => {
    switch (position) {
        case "tl":
        case "br":
        case "start":
        case "end":
            return "nwse-resize";
        case "tr":
        case "bl":
            return "nesw-resize";
        default:
            return "move";
    }
};
const resizeCoordinates = (clientX, clientY, coordinates, position) => {
    const { x1, y1, x2, y2 } = coordinates;
    switch (position) {
        case "tl":
        case "start":
            return { x1: clientX, y1: clientY, x2, y2 };
        case "tr":
            return { x1, y1: clientY, x2: clientX, y2 };
        case "bl":
            return { x1: clientX, y1, x2, y2: clientY };
        case "br":
        case "end":
            return { x1, y1, x2: clientX, y2: clientY };
        default:
            console.warn(`Неизвестная позиция для мышки: ${position}`);
            break;
    }
};

const getMouseCoordinates = (event) => {
    const scale = getScale();
    const scaledOffset = getScaledOffset();
    const panOffset = getPanOffset();
    const clientX = (event.clientX - panOffset.x * scale + scaledOffset.x) / scale;
    const clientY = (event.clientY - panOffset.y * scale + scaledOffset.y) / scale;
    return { clientX, clientY };
}
const zoomingBy = (delta) => {
    let scale = getScale() + delta;
    scale = Math.min(scale, 20);
    scale = Math.max(scale, 0.1);
    setScale(scale);
    console.log(getScale());
}

const enableCanvas = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    document.getElementById("selection").onchange = () => { setTool("selection"); };;
    document.getElementById("line").onchange = () => { setTool("line"); };
    document.getElementById("rectangle").onchange = () => { setTool("rectangle"); };

    // ---

    function drawElement(element) {
        context.beginPath();
        const { coordinates, properties } = element;
        const { x1, y1, x2, y2 } = coordinates;
        const { type } = properties;
        switch (type) {
            case "line":
                context.moveTo(x1, y1);
                context.lineTo(x2, y2);
                break;
            case "rectangle":
                const width = x2 - x1;
                const height = y2 - y1;
                context.rect(x1, y1, width, height);
                break;
            default:
                console.warn(`Неизвестный тип: ${type}`);
                break;
        }
        // context.strokeStyle = properties.strokeStyle;
        // context.lineWidth = properties.lineWidth;
        context.stroke();
    }

    function createElement(coordinates, properties) {
        const elements = getElements();
        elements.push({ coordinates, properties });
        const createdElement = getLastElement();
        createdElement.id = elements.length - 1;
    }

    function updateElement(id, coordinates, properties) {
        const element = getElements().find((element) => element.id == id);
        if (element) {
            if (coordinates) {
                element.coordinates = coordinates;
            }
            if (properties) {
                element.properties = properties;
            }
        } else {
            console.warn(`Элемент с id: ${id} не найден`);
        }
    }

    function deleteElement(id) {
        getElements() = getElements().filter((element) => element.id != id);
    }

    function updateCanvas() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);

        const scale = getScale();
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        const scaledOffset = { x: (scaledWidth - canvas.width) / 2, y: (scaledHeight - canvas.height) / 2 }
        const panOffset = getPanOffset();
        setScaledOffset(scaledOffset);
        context.save();
        context.translate(panOffset.x * scale - scaledOffset.x, panOffset.y * scale - scaledOffset.y);
        context.scale(scale, scale);

        getElements().forEach((element) => { drawElement(element); });
        context.restore();
    }

    // ---

    window.addEventListener("resize", (event) => { updateCanvas(); });
    updateCanvas();

    canvas.addEventListener("mousedown", (event) => {
        const { clientX, clientY } = getMouseCoordinates(event);
        if (event.button == 1) {
            if (getPressedKeys().size == 0) {
                setState("panning");
                setMouseOffset({ x: clientX, y: clientY });
            }
            return;
        }
        switch (getTool()) {
            case "selection": {
                const element = getElementAtPosition(clientX, clientY, getElements());
                if (element) {
                    element.offset = {
                        x: clientX - element.coordinates.x1,
                        y: clientY - element.coordinates.y1
                    };
                    setSelectedElement(element);
                    if (element.position == "inside") {
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
                    x1: clientX,
                    y1: clientY,
                    x2: clientX,
                    y2: clientY
                }, {
                    type: getTool()
                });
                setSelectedElement(getLastElement());
                setState("drawing");
                break;
            }
            default:
                break;
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        const { clientX, clientY } = getMouseCoordinates(event);
        if (getTool() == "selection") {
            const element = getElementAtPosition(clientX, clientY, getElements());
            event.target.style.cursor = element ? cursorAtPosition(element.position) : "default";
        }
        switch (getState()) {
            case "unfocused": {
                break;
            }
            case "moving": {
                const { coordinates, offset } = getSelectedElement();
                const { x1, y1, x2, y2 } = coordinates;
                const width = x2 - x1;
                const height = y2 - y1;
                coordinates.x1 = clientX - offset.x;
                coordinates.y1 = clientY - offset.y;
                coordinates.x2 = clientX - offset.x + width;
                coordinates.y2 = clientY - offset.y + height;
                break;
            }
            case "drawing": {
                const { coordinates, properties } = getLastElement();
                const { type } = properties;
                switch (type) {
                    case "line":
                    case "rectangle":
                        coordinates.x2 = clientX;
                        coordinates.y2 = clientY;
                        break;
                    default:
                        console.warn(`Неизвестный тип: ${type}`)
                        break;
                }
                break;
            }
            case "resizing": {
                const { id, coordinates, position } = getSelectedElement();
                updateElement(id, resizeCoordinates(clientX, clientY, coordinates, position));
                break;
            }
            case "panning": {
                const panOffset = getPanOffset();
                const mouseOffset = getMouseOffset();
                const deltaX = clientX - mouseOffset.x;
                const deltaY = clientY - mouseOffset.y;
                setPanOffset({ x: panOffset.x + deltaX, y: panOffset.y + deltaY });
                break;
            }
            default:
                console.warn(`Неизвестное состояние: ${getState()}`);
                break;
        }
        updateCanvas();
    });

    canvas.addEventListener("mouseup", (event) => {
        if (getSelectedElement()) {
            if (getState() == "drawing" || getState() == "resizing") {
                const element = getLastElement();
                const { x1, y1, x2, y2 } = adjustCoordinates(element);
                updateElement(element.id, { x1, y1, x2, y2 });
            }
        }
        setState("unfocused");
        setSelectedElement(null);
    });

    canvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        let delta = event.deltaY;
        const pressedKeys = getPressedKeys();
        delta *= -0.005;
        if (pressedKeys.size == 1 && pressedKeys.has("Control")) {
            delta *= 2.5;
        }
        zoomingBy(delta);
        // const panOffset = getPanOffset();
        // panOffset.x -= event.deltaX;
        // panOffset.y -= event.deltaY;
        updateCanvas();
    });

    window.addEventListener("keydown", (event) => {
        getPressedKeys().add(event.key);
    });

    window.addEventListener("keyup", (event) => {
        getPressedKeys().delete(event.key);
    });
};

document.addEventListener("DOMContentLoaded", enableCanvas);