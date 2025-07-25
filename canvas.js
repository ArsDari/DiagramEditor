const STATE = {
    UNFOCUSED: "unfocused",
    MOVING: "moving",
    DRAWING: "drawing",
    RESIZING: "resizing",
    PANNING: "panning",
    WRITING: "writing"
}

const TOOLS = {
    SELECTION: "selection",
    RECTANGLE: "rectangle",
    LINE: "line",
    ARROW: "arrow",
    TEXT: "text"
}

const POSITION = {
    TOPLEFT: "tl",
    TOPRIGHT: "tr",
    BOTTOMLEFT: "bl",
    BOTTOMRIGHT: "br",
    HEIGHT: "height",
    WIDTH: "width",
    INSIDE: "inside",
    START: "start",
    END: "end"
}

const MOUSEBUTTONS = {
    SCROLLWHEEL: 1
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const SCALE_FACTOR = 1.1;

const fileState = {
    elements: [],
    newElementId: 0
}

const applicationState = {
    state: "unfocused",
    tool: "selection",
    scale: 1,
    panOffset: { x: 0, y: 0 },
    mouseOffset: { x: 0, y: 0 },
    selectedElement: null,
    pressedKeys: new Set()
}

const getElements = () => fileState.elements;

const getElement = id => fileState.elements.find(element => element.id == id);
const getLastElement = () => fileState.elements.at(-1);

const createElement = element => fileState.elements.push(element);
const deleteElement = id => {
    const index = fileState.elements.findIndex(element => element.id == id);
    if (index >= 0) {
        fileState.elements.splice(index, 1);
    } else {
        console.warn(`Элемент с идентификатором: ${id} не найден`);
    }
};
const updateElement = (element, values) => {
    const { coordinates } = values;
    if (coordinates) {
        element.coordinates.x1 = coordinates.x1;
        element.coordinates.y1 = coordinates.y1;
        element.coordinates.x2 = coordinates.x2;
        element.coordinates.y2 = coordinates.y2;
    }
    // ...
};

const getNewElementId = () => fileState.newElementId++;

const setState = state => applicationState.state = state;
const getState = () => applicationState.state;

const setTool = tool => applicationState.tool = tool;
const getTool = () => applicationState.tool;

const setScale = scale => applicationState.scale = scale;
const getScale = () => applicationState.scale;

const setPanOffset = offset => applicationState.panOffset = offset;
const updatePanOffset = (x, y) => {
    applicationState.panOffset.x += x;
    applicationState.panOffset.y += y;
}
const getPanOffset = () => applicationState.panOffset;

const setMouseOffset = offset => applicationState.mouseOffset = offset;
const getMouseOffset = () => applicationState.mouseOffset;

const selectElement = element => applicationState.selectedElement = element;
const getSelectedElement = () => applicationState.selectedElement;

const getPressedKeys = () => applicationState.pressedKeys;

const adjustCoordinates = (coordinates, type) => {
    const { x1, y1, x2, y2 } = coordinates;
    switch (type) {
        case TOOLS.RECTANGLE:
            return {
                x1: Math.min(x1, x2),
                y1: Math.min(y1, y2),
                x2: Math.max(x1, x2),
                y2: Math.max(y1, y2)
            };
        case TOOLS.LINE:
            if (x1 < x2 || (x1 == x2 && y1 < y2)) {
                return {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2
                };
            } else {
                return {
                    x1: x2,
                    y1: y2,
                    x2: x1,
                    y2: y1
                };
            }
        default:
            console.warn(`Неизвестный тип: ${type}`);
            break;
    }
};

const resizeCoordinates = (mousePosition, coordinates, positionWithinElement) => {
    const { x1, y1, x2, y2 } = coordinates;
    switch (positionWithinElement) {
        case POSITION.TOPLEFT:
        case POSITION.START:
            return { x1: mousePosition.x, y1: mousePosition.y, x2, y2 };
        case POSITION.TOPRIGHT:
            return { x1, y1: mousePosition.y, x2: mousePosition.x, y2 };
        case POSITION.BOTTOMLEFT:
            return { x1: mousePosition.x, y1, x2, y2: mousePosition.y };
        case POSITION.BOTTOMRIGHT:
        case POSITION.END:
            return { x1, y1, x2: mousePosition.x, y2: mousePosition.y };
        default:
            console.warn(`Неизвестная позиция мышки в элементе: ${positionWithinElement}`);
            break;
    }
};

const mouseAtPosition = position => {
    switch (position) {
        case POSITION.TOPLEFT:
        case POSITION.BOTTOMRIGHT:
        case POSITION.START:
        case POSITION.END:
            return "nwse-resize";
        case POSITION.TOPRIGHT:
        case POSITION.BOTTOMLEFT:
            return "nesw-resize";
        default:
            return "move";
    }
};

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
const checkPointsProximity = (a, b, distance) => Math.abs(a.x - b.x) < distance && Math.abs(a.y - b.y) < distance;

const positionWithinElement = (position, element) => {
    const { coordinates, type } = element;
    const { x1, y1, x2, y2 } = coordinates;
    const proximity = 5;
    switch (type) {
        case TOOLS.TEXT: {
            const inside = position.x >= x1 && position.x <= x2 && position.y >= y1 && position.y <= y2 ? POSITION.INSIDE : null;
            return inside;
        }
        case TOOLS.RECTANGLE: {
            const topLeftPoint = { x: x1, y: y1 };
            const topRightPoint = { x: x2, y: y1 };
            const bottomLeftPoint = { x: x1, y: y2 };
            const bottomRightPoint = { x: x2, y: y2 };
            const topLeft = checkPointsProximity(position, topLeftPoint, proximity) ? POSITION.TOPLEFT : null;
            const topRight = checkPointsProximity(position, topRightPoint, proximity) ? POSITION.TOPRIGHT : null;
            const bottomLeft = checkPointsProximity(position, bottomLeftPoint, proximity) ? POSITION.BOTTOMLEFT : null;
            const bottomRight = checkPointsProximity(position, bottomRightPoint, proximity) ? POSITION.BOTTOMRIGHT : null;
            const inside = position.x >= x1 && position.x <= x2 && position.y >= y1 && position.y <= y2 ? POSITION.INSIDE : null;
            return topLeft || topRight || bottomLeft || bottomRight || inside;
        }
        case TOOLS.ARROW:
        case TOOLS.LINE: {
            const startPoint = { x: x1, y: y1 };
            const endPoint = { x: x2, y: y2 };
            const offset = distance(startPoint, endPoint) - (distance(startPoint, position) + distance(endPoint, position));
            const start = checkPointsProximity(position, startPoint, proximity) ? POSITION.START : null;
            const end = checkPointsProximity(position, endPoint, proximity) ? POSITION.END : null;
            const inside = Math.abs(offset) < 1 ? POSITION.INSIDE : null;
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
        .find(element => element.position != null);
};

const getMouseCoordinates = event => {
    return toWorld(event.x, event.y);
};

const toWorld = (x, y) => {
    const scale = getScale();
    const panOffset = getPanOffset();
    return {
        x: (x - panOffset.x) / scale,
        y: (y - panOffset.y) / scale
    };
}

const toScreen = (x, y) => {
    const scale = getScale();
    const panOffset = getPanOffset();
    return {
        x: x * scale + panOffset.x,
        y: y * scale + panOffset.y
    };
}

const scaleAt = (x, y, newScale) => {
    const oldScale = getScale();
    const panOffset = getPanOffset();
    panOffset.x = x - (x - panOffset.x) * (newScale / oldScale);
    panOffset.y = y - (y - panOffset.y) * (newScale / oldScale);
    setScale(newScale);
};

// ---

const enableCanvas = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const currentScaleOnPage = document.getElementById("current-scale");

    document.getElementById("selection").onchange = () => setTool(TOOLS.SELECTION);
    document.getElementById("line").onchange = () => setTool(TOOLS.LINE);
    document.getElementById("rectangle").onchange = () => setTool(TOOLS.RECTANGLE);
    document.getElementById("arrow").onchange = () => setTool(TOOLS.ARROW);
    document.getElementById("text").onchange = () => setTool(TOOLS.TEXT);

    document.getElementById("zoom-out").onclick = () => handleScale(canvas.width / 2, canvas.height / 2, 1 / SCALE_FACTOR);
    document.getElementById("zoom-in").onclick = () => handleScale(canvas.width / 2, canvas.height / 2, SCALE_FACTOR);
    currentScaleOnPage.innerHTML = "100%";

    // ---

    const handleScale = (x, y, scaleBy) => {
        const oldScale = getScale();
        const newScale = oldScale * scaleBy;
        if (oldScale == MIN_ZOOM || oldScale == MAX_ZOOM) {
            if (newScale > MIN_ZOOM || newScale < MAX_ZOOM) {
                scaleAt(x, y, newScale);
            }
        } if (newScale < MIN_ZOOM) {
            scaleAt(x, y, MIN_ZOOM);
        } else if (newScale > MAX_ZOOM) {
            scaleAt(x, y, MAX_ZOOM);
        } else {
            scaleAt(x, y, newScale);
        }
        currentScaleOnPage.innerHTML = `${Math.trunc(getScale() * 100)}%`;
    }

    const drawElement = element => {
        const { coordinates, type } = element;
        const { x1, y1, x2, y2 } = coordinates;
        const selectedElement = getSelectedElement();
        context.save();
        if (selectedElement?.id == element.id && getState() != STATE.DRAWING) {
            context.save();
            context.beginPath();
            const distance = 5;
            let left, top, right, bottom = 0;
            if (x1 < x2) {
                left = x1;
                right = x2;
            } else {
                left = x2;
                right = x1;
            }
            if (y1 < y2) {
                top = y1;
                bottom = y2;
            } else {
                top = y2;
                bottom = y1;
            }
            const width = right - left;
            const height = bottom - top;
            context.strokeStyle = "#7572DE";
            context.lineWidth = 1;
            context.rect(left - distance, top - distance, width + distance * 2, height + distance * 2);
            context.stroke();
            context.restore();
        }
        context.beginPath();
        switch (type) {
            case TOOLS.LINE: {
                context.moveTo(x1, y1);
                context.lineTo(x2, y2);
                break;
            }
            case TOOLS.RECTANGLE: {
                const width = x2 - x1;
                const height = y2 - y1;
                context.rect(x1, y1, width, height);
                break;
            }
            case TOOLS.ARROW: {
                let quarter = "";
                const width = Math.abs(x2 - x1);
                const height = Math.abs(y2 - y1);
                const length = Math.sqrt(width * width, height * height);
                context.moveTo(x1, y1);
                if (x1 <= x2 && y1 > y2) {
                    quarter = "first";
                    if (width < height) {
                        context.lineTo(x1 + width / 2, y1);
                        context.lineTo(x1 + width / 2, y1 - height);
                    } else {
                        context.lineTo(x1, y1 - height / 2);
                        context.lineTo(x1 + width, y1 - height / 2);
                    }
                } else if (x1 <= x2 && y1 <= y2) {
                    quarter = "second";
                    if (width < height) {
                        context.lineTo(x1 + width / 2, y1);
                        context.lineTo(x1 + width / 2, y1 + height);
                    } else {
                        context.lineTo(x1, y1 + height / 2);
                        context.lineTo(x1 + width, y1 + height / 2);
                    }
                } else if (x1 > x2 && y1 <= y2) {
                    quarter = "third";
                    if (width < height) {
                        context.lineTo(x1 - width / 2, y1);
                        context.lineTo(x1 - width / 2, y1 + height);
                    } else {
                        context.lineTo(x1, y1 + height / 2);
                        context.lineTo(x1 - width, y1 + height / 2);
                    }
                } else {
                    quarter = "fourth";
                    if (width < height) {
                        context.lineTo(x1 - width / 2, y1);
                        context.lineTo(x1 - width / 2, y1 - height);
                    } else {
                        context.lineTo(x1, y1 - height / 2);
                        context.lineTo(x1 - width, y1 - height / 2);
                    }
                }
                context.lineTo(x2, y2);
                context.save();
                context.moveTo(x2, y2);
                const headLength = 20;
                switch (quarter) {
                    case "first":
                        if (width < height) {
                            context.lineTo(x2 - headLength * Math.cos(Math.PI / 8), y2 - headLength * Math.sin(Math.PI / 8));
                            context.moveTo(x2, y2);
                            context.lineTo(x2 - headLength * Math.cos(Math.PI / 8), y2 + headLength * Math.sin(Math.PI / 8));
                        } else {
                            context.lineTo(x2 + headLength * Math.sin(Math.PI / 8), y2 + headLength * Math.cos(Math.PI / 8));
                            context.moveTo(x2, y2);
                            context.lineTo(x2 - headLength * Math.sin(Math.PI / 8), y2 + headLength * Math.cos(Math.PI / 8));
                        }
                        break;
                    case "second":
                        if (width < height) {
                            context.lineTo(x2 - headLength * Math.cos(Math.PI / 8), y2 - headLength * Math.sin(Math.PI / 8));
                            context.moveTo(x2, y2);
                            context.lineTo(x2 - headLength * Math.cos(Math.PI / 8), y2 + headLength * Math.sin(Math.PI / 8));
                        } else {
                            context.lineTo(x2 + headLength * Math.sin(Math.PI / 8), y2 - headLength * Math.cos(Math.PI / 8));
                            context.moveTo(x2, y2);
                            context.lineTo(x2 - headLength * Math.sin(Math.PI / 8), y2 - headLength * Math.cos(Math.PI / 8));
                        }
                        break;
                    case "third": {
                        if (width < height) {
                            context.lineTo(x2 + headLength * Math.cos(Math.PI / 8), y2 - headLength * Math.sin(Math.PI / 8));
                            context.moveTo(x2, y2);
                            context.lineTo(x2 + headLength * Math.cos(Math.PI / 8), y2 + headLength * Math.sin(Math.PI / 8));
                        } else {
                            context.lineTo(x2 + headLength * Math.sin(Math.PI / 8), y2 - headLength * Math.cos(Math.PI / 8));
                            context.moveTo(x2, y2);
                            context.lineTo(x2 - headLength * Math.sin(Math.PI / 8), y2 - headLength * Math.cos(Math.PI / 8));
                        }
                        break;
                    }
                    case "fourth":
                        if (width < height) {
                            context.lineTo(x2 + headLength * Math.cos(Math.PI / 8), y2 - headLength * Math.sin(Math.PI / 8));
                            context.moveTo(x2, y2);
                            context.lineTo(x2 + headLength * Math.cos(Math.PI / 8), y2 + headLength * Math.sin(Math.PI / 8));
                        } else {
                            context.lineTo(x2 + headLength * Math.sin(Math.PI / 8), y2 + headLength * Math.cos(Math.PI / 8));
                            context.moveTo(x2, y2);
                            context.lineTo(x2 - headLength * Math.sin(Math.PI / 8), y2 + headLength * Math.cos(Math.PI / 8));
                        }
                        break;
                    default:
                        break;
                }
                context.restore();
                break;
            }
            case TOOLS.TEXT: {
                context.textBaseline = "top";
                context.font = "24px sans-serif";
                context.fillText(element.text, x1, y1);
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
        const panOffset = getPanOffset();
        context.setTransform(scale, 0, 0, scale, panOffset.x, panOffset.y);
        getElements().forEach(element => drawElement(element));
        requestAnimationFrame(updateCanvas);
    }

    requestAnimationFrame(updateCanvas);

    // ---

    canvas.addEventListener("mousedown", event => {
        const mousePosition = getMouseCoordinates(event);
        const tool = getTool();
        if (event.button == MOUSEBUTTONS.SCROLLWHEEL && getState() == STATE.UNFOCUSED) {
            event.target.style.cursor = "grab";
            setState(STATE.PANNING);
            setMouseOffset({ x: mousePosition.x, y: mousePosition.y });
            return;
        }
        switch (tool) {
            case TOOLS.SELECTION: {
                const element = getElementAtPosition(mousePosition);
                if (element) {
                    element.mouseOffset.x = mousePosition.x - element.coordinates.x1;
                    element.mouseOffset.y = mousePosition.y - element.coordinates.y1;
                    if (element.position == POSITION.INSIDE) {
                        setState(STATE.MOVING);
                    } else {
                        setState(STATE.RESIZING);
                    }
                    selectElement(element);
                } else {
                    selectElement(null);
                }
                break;
            }
            case TOOLS.TEXT: {
                const element = {
                    id: getNewElementId(),
                    coordinates: {
                        x1: mousePosition.x,
                        y1: mousePosition.y,
                        x2: mousePosition.x,
                        y2: mousePosition.y
                    },
                    type: tool,
                    mouseOffset: { x: 0, y: 0 },
                    text: ""
                }
                createElement(element);
                selectElement(element);
                setState(STATE.WRITING);
                break;
            }
            case TOOLS.ARROW:
            case TOOLS.LINE:
            case TOOLS.RECTANGLE: {
                const element = {
                    id: getNewElementId(),
                    coordinates: {
                        x1: mousePosition.x,
                        y1: mousePosition.y,
                        x2: mousePosition.x,
                        y2: mousePosition.y
                    },
                    type: tool,
                    mouseOffset: { x: 0, y: 0 }
                }
                createElement(element);
                selectElement(element);
                setState(STATE.DRAWING);
                break;
            }
            default:
                console.warn(`Неизвестный аргумент: ${tool}`);
                break;
        }
    });

    canvas.addEventListener("mousemove", event => {
        const mousePosition = getMouseCoordinates(event);
        const state = getState();
        const tool = getTool();
        switch (state) {
            case STATE.UNFOCUSED: {
                if (tool == TOOLS.SELECTION) {
                    const element = getElementAtPosition(mousePosition);
                    event.target.style.cursor = element ? mouseAtPosition(element.position) : "default";
                }
                break;
            }
            case STATE.MOVING: {
                const element = getSelectedElement();
                const { coordinates, mouseOffset } = element;
                const width = coordinates.x2 - coordinates.x1;
                const height = coordinates.y2 - coordinates.y1;
                updateElement(element, {
                    coordinates: {
                        x1: mousePosition.x - mouseOffset.x,
                        y1: mousePosition.y - mouseOffset.y,
                        x2: mousePosition.x - mouseOffset.x + width,
                        y2: mousePosition.y - mouseOffset.y + height
                    }
                });
                break;
            }
            case STATE.DRAWING: {
                const element = getLastElement();
                const { coordinates, type } = element;
                switch (type) {
                    case TOOLS.ARROW:
                    case TOOLS.LINE:
                    case TOOLS.RECTANGLE:
                        coordinates.x2 = mousePosition.x;
                        coordinates.y2 = mousePosition.y;
                        break;
                    default:
                        console.warn(`Неизвестный тип: ${type}`);
                        break;
                }
                break;
            }
            case STATE.RESIZING: {
                const element = getSelectedElement();
                const coordinates = resizeCoordinates(mousePosition, element.coordinates, element.position);
                updateElement(element, { coordinates });
                break;
            }
            case STATE.PANNING: {
                const mouseOffset = getMouseOffset();
                const deltaX = mousePosition.x - mouseOffset.x;
                const deltaY = mousePosition.y - mouseOffset.y;
                updatePanOffset(deltaX, deltaY);
                break;
            }
            case STATE.WRITING: {
                console.log('Пишем');
                setState(STATE.UNFOCUSED);
                break;
            }
            default:
                console.warn(`Неизвестное состояние: ${state}`);
                break;
        }
    });

    canvas.addEventListener("mouseup", event => {
        event.target.style.cursor = "default";
        if (getSelectedElement()) {
            const state = getState();
            switch (state) {
                case STATE.WRITING:
                case STATE.UNFOCUSED:
                case STATE.PANNING:
                case STATE.MOVING:
                    break;
                case STATE.DRAWING:
                case STATE.RESIZING: {
                    const element = getSelectedElement();
                    const { coordinates, type } = element;
                    if (coordinates.x1 == coordinates.x2 && coordinates.y1 == coordinates.y2) {
                        deleteElement(element.id);
                        break;
                    }
                    switch (type) {
                        case TOOLS.ARROW:
                            break;
                        case TOOLS.LINE:
                        case TOOLS.RECTANGLE: {
                            updateElement(element, { coordinates: adjustCoordinates(coordinates, type) });
                            break;
                        }
                        default:
                            console.warn(`Неизвестный тип: ${type}`);
                            break;
                    }
                    break;
                }
                default:
                    console.warn(`Неизвестное состояние: ${state}`);
                    break;
            }
        }
        setState(STATE.UNFOCUSED);
    });

    canvas.addEventListener("wheel", event => {
        event.preventDefault();
        const { offsetX, offsetY, deltaY } = event;
        const oldScale = getScale();
        const distance = 100 * oldScale;
        const panningDelta = deltaY > 0 ? -distance : distance;
        const pressedKeys = getPressedKeys();
        if (pressedKeys.size == 0) {
            updatePanOffset(0, panningDelta);
        } else if (pressedKeys.size == 1) {
            if (pressedKeys.has("Shift")) {
                updatePanOffset(panningDelta, 0);
            } else if (pressedKeys.has("Control")) {
                const scaleBy = deltaY > 0 ? 1 / SCALE_FACTOR : SCALE_FACTOR;
                handleScale(offsetX, offsetY, scaleBy);
            }
        }
    });

    window.addEventListener("keydown", event => {
        if (event.key == "Delete") {
            const selectedElement = getSelectedElement();
            if (selectedElement?.id >= 0) {
                deleteElement(selectedElement.id);
                selectElement(null);
            }
        } else {
            getPressedKeys().add(event.key);
        }
    });
    window.addEventListener("keyup", event => getPressedKeys().delete(event.key));
}

window.addEventListener("DOMContentLoaded", enableCanvas);