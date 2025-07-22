const state = {
    current: "unfocused",
    tool: "selection",
    scale: 1,
    scaledOffset: { x: 0, y: 0 },
    panOffset: { x: 0, y: 0 },
    mouseOffset: { x: 0, y: 0 },
    elements: [],
    newElementId: 0,
    selectedElementId: null,
    pressedKeys: new Set()
}

const setState = updated => state.current = updated;
const getState = () => state.current;

const setTool = tool => state.tool = tool;
const getTool = () => state.tool;

const setScale = scale => state.scale = scale;
const getScale = () => state.scale;

const setScaledOffset = offset => state.scaledOffset = offset;
const getScaledOffset = () => state.scaledOffset;

const setPanOffset = offset => state.panOffset = offset;
const getPanOffset = () => state.panOffset;

const setMouseOffset = offset => state.mouseOffset = offset;
const getMouseOffset = () => state.mouseOffset;

const getElement = id => state.elements.find(element => element.id == id);
const createElement = element => state.elements.push(element);
const deleteElement = id => {
    const index = state.elements.findIndex(element => element.id == id);
    if (index > 0) {
        state.elements.splice(index, 1);
    } else {
        console.warn(`Элемент с идентификатором: ${id} не найден`);
    }
};
const updateElement = (id, values) => {
    const element = getElement(id);
    if (element) {
        if (values.coordinates) {
            const coordinates = values.coordinates;
            element.x1 = coordinates.x1;
            element.y1 = coordinates.y1;
            element.x2 = coordinates.x2;
            element.y2 = coordinates.y2;
        }
        // ...
    } else {
        console.warn(`Элемент с идентификатором: ${id} не найден`);
    }
};

const getElements = () => state.elements;
const doToAllElements = callback => state.elements = state.elements.map(element => callback(element));
const getLastElement = () => state.elements.at(-1);

const getNewElementId = () => state.newElementId++;

const selectElementById = id => state.selectedElementId = id;
const getSelectedElement = () => getElement(state.selectedElementId);

const getPressedKeys = () => state.pressedKeys;

// ---

const adjustCoordinates = (element) => {
    const { x1, y1, x2, y2, type } = element;
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
            console.warn(`Неизвестный тип: ${type}`);
            break;
    }
};

const resizeCoordinates = (mousePosition, element) => {
    const { x1, y1, x2, y2, position } = element;
    switch (position) {
        case "tl":
        case "start":
            return { x1: mousePosition.x, y1: mousePosition.y, x2, y2 };
        case "tr":
            return { x1, y1: mousePosition.y, x2: mousePosition.x, y2 };
        case "bl":
            return { x1: mousePosition.x, y1, x2, y2: mousePosition.y };
        case "br":
        case "end":
            return { x1, y1, x2: mousePosition.x, y2: mousePosition.y };
        default:
            console.warn(`Неизвестная позиция для мышки: ${position}`);
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

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
const checkPointsProximity = (a, b, distance) => Math.abs(a.x - b.x) < distance && Math.abs(a.y - b.y) < distance;

const positionWithinElement = (position, element) => {
    const { x1, y1, x2, y2, type } = element;
    const proximity = 5;
    switch (type) {
        case "rectangle": {
            const topLeftPoint = { x: x1, y: y1 };
            const topRightPoint = { x: x2, y: y1 };
            const bottomLeftPoint = { x: x1, y: y2 };
            const bottomRightPoint = { x: x2, y: y2 };
            const topLeft = checkPointsProximity(position, topLeftPoint, proximity) ? "tl" : null;
            const topRight = checkPointsProximity(position, topRightPoint, proximity) ? "tr" : null;
            const bottomLeft = checkPointsProximity(position, bottomLeftPoint, proximity) ? "bl" : null;
            const bottomRight = checkPointsProximity(position, bottomRightPoint, proximity) ? "br" : null;
            const inside = position.x >= x1 && position.x <= x2 && position.y >= y1 && position.y <= y2 ? "inside" : null;
            return topLeft || topRight || bottomLeft || bottomRight || inside;
        }
        case "line": {
            const startPoint = { x: x1, y: y1 };
            const endPoint = { x: x2, y: y2 };
            const offset = distance(startPoint, endPoint) - (distance(startPoint, position) + distance(endPoint, position));
            const start = checkPointsProximity(position, startPoint, proximity) ? "start" : null;
            const end = checkPointsProximity(position, endPoint, proximity) ? "end" : null;
            const inside = Math.abs(offset) < 1 ? "inside" : null;
            return start || end || inside;
        }
        default:
            console.warn(`Неизвестный тип: ${type}`);
            break;
    }
};

const getElementAtPosition = position => {
    return getElements()
        .map(element => ({ ...element, position: positionWithinElement(position, element) }))
        .find(position => position != null);
};

const getMouseCoordinates = event => {
    const scale = getScale();
    const scaledOffset = getScaledOffset();
    const panOffset = getPanOffset();
    const x = (event.clientX - panOffset.x * scale + scaledOffset.x) / scale;
    const y = (event.clientY - panOffset.y * scale + scaledOffset.y) / scale;
    return { x, y };
};

const zoomingBy = delta => {
    let scale = getScale() + delta;
    scale = Math.min(scale, 20);
    scale = Math.max(scale, 0.1);
    setScale(scale);
    //console.log(getScale());
};

// ---

const enableCanvas = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    document.getElementById("selection").onchange = () => setTool("selection");
    document.getElementById("line").onchange = () => setTool("line");
    document.getElementById("rectangle").onchange = () => setTool("rectangle");

    // ---

    const drawElement = element => {
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
        context.stroke();
        context.restore();
    };

    const updateCanvas = () => {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);
        const scale = getScale();
        const scaledOffset = {
            x: (canvas.width * scale - canvas.width) / 2, // поменять двойки на значения мыши
            y: (canvas.height * scale - canvas.height) / 2
        };
        setScaledOffset(scaledOffset);
        const panOffset = getPanOffset();
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

    window.addEventListener("resize", () => updateCanvas());

    canvas.addEventListener("mousedown", event => {
        const mousePosition = getMouseCoordinates(event);
        const tool = getTool();
        if (event.button == 1) { // вынести 1 в Scroll Wheel
            if (getPressedKeys().size == 0) {
                setState("panning");
                setMouseOffset({ x: mousePosition.x, y: mousePosition.y });
            }
            return;
        }
        switch (tool) {
            case "selection": {
                const element = getElementAtPosition(mousePosition);
                if (element) {
                    element.mouseOffset.x = mousePosition.x - element.x1;
                    element.mouseOffset.y = mousePosition.y - element.y1;
                    selectElementById(element.id);
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
                    id: getNewElementId(),
                    x1: mousePosition.x,
                    y1: mousePosition.y,
                    x2: mousePosition.x,
                    y2: mousePosition.y,
                    type: tool,
                    position: "",
                    mouseOffset: { x: 0, y: 0 }
                });
                selectElementById(getLastElement().id);
                setState("drawing");
                break;
            }
            default:
                console.warn(`Неизвестный аргумент: ${tool}`);
                break;
        }
        console.log(state.selectedElementId);
    });

    canvas.addEventListener("mousemove", event => {
        const mousePosition = getMouseCoordinates(event);
        const state = getState();
        if (getTool() == "selection" && state == "unfocused") {
            const element = getElementAtPosition(mousePosition);
            event.target.style.cursor = element ? cursorAtPosition(element.position) : "default";
        }
        switch (state) {
            case "unfocused": {
                break;
            }
            case "moving": {
                const element = getSelectedElement();
                const { x1, y1, x2, y2, mouseOffset } = element;
                const width = x2 - x1;
                const height = y2 - y1;
                element.x1 = mousePosition.x - mouseOffset.x;
                element.y1 = mousePosition.y - mouseOffset.y;
                element.x2 = mousePosition.x - mouseOffset.x + width;
                element.y2 = mousePosition.y - mouseOffset.y + height;
                break;
            }
            case "drawing": {
                const element = getLastElement();
                const { type } = element;
                switch (type) {
                    case "line":
                    case "rectangle":
                        element.x2 = mousePosition.x;
                        element.y2 = mousePosition.y;
                        break;
                    default:
                        console.warn(`Неизвестный тип: ${type}`)
                        break;
                }
                break;
            }
            case "resizing": {
                const element = getSelectedElement();
                updateElement(element.id, { coordinates: resizeCoordinates(mousePosition, element) });
                break;
            }
            case "panning": {
                const panOffset = getPanOffset();
                const mouseOffset = getMouseOffset();
                const deltaX = mousePosition.x - mouseOffset.x;
                const deltaY = mousePosition.y - mouseOffset.y;
                setPanOffset({ x: panOffset.x + deltaX, y: panOffset.y + deltaY });
                break;
            }
            default:
                console.warn(`Неизвестное состояние: ${state}`);
                break;
        }
        updateCanvas();
    });

    canvas.addEventListener("mouseup", () => {
        if (getSelectedElement()) {
            const state = getState();
            switch (state) {
                case "moving": {
                    break;
                }
                case "drawing":
                case "resizing": {
                    const element = getLastElement();
                    updateElement(element.id, { coordinates: adjustCoordinates(element) });
                    break;
                }
                default:
                    console.warn(`Неизвестное состояние: ${state}`);
                    break;
            }
        }
        setState("unfocused");
        selectElementById(null);
        updateCanvas();
    });

    canvas.addEventListener("wheel", event => {
        event.preventDefault();
        let delta = event.deltaY * -0.005;
        const pressedKeys = getPressedKeys();
        if (pressedKeys.size == 1 && pressedKeys.has("Control")) {
            delta *= 2;
        }
        zoomingBy(delta);
        updateCanvas();
    });

    window.addEventListener("keydown", event => getPressedKeys().add(event.key));
    window.addEventListener("keyup", event => getPressedKeys().delete(event.key));
}

window.addEventListener("DOMContentLoaded", enableCanvas);