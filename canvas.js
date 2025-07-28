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
    LEFTLINE: "leftline",
    TOPLINE: "topline",
    RIGHTLINE: "rightline",
    BOTTOMLINE: "bottomline",
    INSIDE: "inside",
    START: "start",
    END: "end"
}

const MOUSEBUTTONS = {
    SCROLLWHEEL: 1
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
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

const setPanOffset = (x, y) => {
    applicationState.panOffset.x = x;
    applicationState.panOffset.y = y;
}
const updatePanOffset = (x, y) => {
    applicationState.panOffset.x += x;
    applicationState.panOffset.y += y;
}
const getPanOffset = () => applicationState.panOffset;

const setMouseOffset = (x, y) => {
    applicationState.mouseOffset.x = x;
    applicationState.mouseOffset.y = y;
}
const getMouseOffset = () => applicationState.mouseOffset;

const selectElement = element => applicationState.selectedElement = element;
const getSelectedElement = () => applicationState.selectedElement;

const getPressedKeys = () => applicationState.pressedKeys;

const adjustCoordinates = element => {
    const { coordinates } = element;
    if (coordinates.x1 > coordinates.x2 && coordinates.y1 > coordinates.y2) {
        [coordinates.x1, coordinates.x2] = [coordinates.x2, coordinates.x1];
        [coordinates.y1, coordinates.y2] = [coordinates.y2, coordinates.y1];
        if (element.position == POSITION.TOPLEFT) {
            element.position = POSITION.BOTTOMRIGHT;
        } else if (element.position == POSITION.BOTTOMRIGHT) {
            element.position = POSITION.TOPLEFT;
        } else if (element.position == POSITION.TOPRIGHT) {
            element.position = POSITION.BOTTOMLEFT;
        } else if (element.position == POSITION.BOTTOMLEFT) {
            element.position = POSITION.TOPRIGHT;
        }
    } else if (coordinates.x1 > coordinates.x2) {
        [coordinates.x1, coordinates.x2] = [coordinates.x2, coordinates.x1];
        if (element.position == POSITION.TOPLEFT) {
            element.position = POSITION.TOPRIGHT;
        } else if (element.position == POSITION.TOPRIGHT) {
            element.position = POSITION.TOPLEFT;
        } else if (element.position == POSITION.BOTTOMLEFT) {
            element.position = POSITION.BOTTOMRIGHT;
        } else if (element.position == POSITION.BOTTOMRIGHT) {
            element.position = POSITION.BOTTOMLEFT;
        } else if (element.position == POSITION.LEFTLINE) {
            element.position = POSITION.RIGHTLINE;
        } else if (element.position == POSITION.RIGHTLINE) {
            element.position = POSITION.LEFTLINE;
        }
    } else if (coordinates.y1 > coordinates.y2) {
        [coordinates.y1, coordinates.y2] = [coordinates.y2, coordinates.y1];
        if (element.position == POSITION.TOPLEFT) {
            element.position = POSITION.BOTTOMLEFT;
        } else if (element.position == POSITION.BOTTOMLEFT) {
            element.position = POSITION.TOPLEFT;
        } else if (element.position == POSITION.TOPRIGHT) {
            element.position = POSITION.BOTTOMRIGHT;
        } else if (element.position == POSITION.BOTTOMRIGHT) {
            element.position = POSITION.TOPRIGHT;
        } else if (element.position == POSITION.TOPLINE) {
            element.position = POSITION.BOTTOMLINE;
        } else if (element.position == POSITION.BOTTOMLINE) {
            element.position = POSITION.TOPLINE;
        }
    }
};

const resizeCoordinates = (mousePosition, element) => {
    const { coordinates, position, mouseOffset } = element;
    switch (position) {
        case POSITION.LEFTLINE: {
            coordinates.x1 = mousePosition.x - mouseOffset.x;
            break;
        }
        case POSITION.RIGHTLINE: {
            coordinates.x2 = mousePosition.x - mouseOffset.x;
            break;
        }
        case POSITION.TOPLINE: {
            coordinates.y1 = mousePosition.y - mouseOffset.y;
            break;
        }
        case POSITION.BOTTOMLINE: {
            coordinates.y2 = mousePosition.y - mouseOffset.y;
            break;
        }
        case POSITION.TOPLEFT:
        case POSITION.START: {
            coordinates.x1 = mousePosition.x - mouseOffset.x;
            coordinates.y1 = mousePosition.y - mouseOffset.y;
            break;
        }
        case POSITION.TOPRIGHT: {
            coordinates.x2 = mousePosition.x - mouseOffset.x;
            coordinates.y1 = mousePosition.y - mouseOffset.y;
            break;
        }
        case POSITION.BOTTOMLEFT: {
            coordinates.x1 = mousePosition.x - mouseOffset.x;
            coordinates.y2 = mousePosition.y - mouseOffset.y;
            break;
        }
        case POSITION.BOTTOMRIGHT:
        case POSITION.END: {
            coordinates.x2 = mousePosition.x - mouseOffset.x;
            coordinates.y2 = mousePosition.y - mouseOffset.y;
            break;
        }
        default:
            console.warn(`Неизвестная позиция мышки в элементе: ${position}`);
            break;
    }
};

const mouseAtPosition = position => {
    switch (position) {
        case POSITION.LEFTLINE:
        case POSITION.RIGHTLINE:
            return "ew-resize";
        case POSITION.TOPLINE:
        case POSITION.BOTTOMLINE:
            return "ns-resize";
        case POSITION.TOPLEFT:
        case POSITION.BOTTOMRIGHT:
        case POSITION.START:
        case POSITION.END:
            return "nwse-resize";
        case POSITION.TOPRIGHT:
        case POSITION.BOTTOMLEFT:
            return "nesw-resize";
        case POSITION.INSIDE:
            return "move";
        default:
            return "default";
    }
};

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
const checkPointsProximity = (a, b, distance) => Math.abs(a.x - b.x) <= distance && Math.abs(a.y - b.y) <= distance;
const isWithinRect = (left, top, right, bottom, point) => point.x > left && point.x < right && point.y > top && point.y < bottom;

const positionWithinElement = (position, element) => {
    const { coordinates, type } = element;
    const { x1, y1, x2, y2 } = coordinates;
    const proximity = 5;
    switch (type) {
        case TOOLS.TEXT: {
            const inside = isWithinRect(x1, y1, x2, y2, position) ? POSITION.INSIDE : null;
            return inside;
        }
        case TOOLS.RECTANGLE: {
            const topLeftPoint = { x: x1 - proximity, y: y1 - proximity };
            const topRightPoint = { x: x2 + proximity, y: y1 - proximity };
            const bottomLeftPoint = { x: x1 - proximity, y: y2 + proximity };
            const bottomRightPoint = { x: x2 + proximity, y: y2 + proximity };

            const leftLine = isWithinRect(x1 - 10, y1, x1, y2, position) ? POSITION.LEFTLINE : null;
            const topLine = isWithinRect(x1, y1 - 10, x2, y1, position) ? POSITION.TOPLINE : null;
            const rightLine = isWithinRect(x2, y1, x2 + 10, y2, position) ? POSITION.RIGHTLINE : null;
            const bottomLine = isWithinRect(x1, y2, x2, y2 + 10, position) ? POSITION.BOTTOMLINE : null;

            const topLeft = checkPointsProximity(position, topLeftPoint, proximity) ? POSITION.TOPLEFT : null;
            const topRight = checkPointsProximity(position, topRightPoint, proximity) ? POSITION.TOPRIGHT : null;
            const bottomLeft = checkPointsProximity(position, bottomLeftPoint, proximity) ? POSITION.BOTTOMLEFT : null;
            const bottomRight = checkPointsProximity(position, bottomRightPoint, proximity) ? POSITION.BOTTOMRIGHT : null;
            const inside = position.x >= x1 && position.x <= x2 && position.y >= y1 && position.y <= y2 ? POSITION.INSIDE : null;
            return topLeft || topRight || bottomLeft || bottomRight || leftLine || topLine || rightLine || bottomLine || inside;
        }
        case TOOLS.ARROW:
        case TOOLS.LINE: {
            const startPoint = { x: x1, y: y1 };
            const endPoint = { x: x2, y: y2 };
            const offset = distance(startPoint, endPoint) - (distance(startPoint, position) + distance(endPoint, position));
            const start = checkPointsProximity(position, startPoint, proximity) ? POSITION.START : null;
            const end = checkPointsProximity(position, endPoint, proximity) ? POSITION.END : null;
            const inside = Math.abs(offset) < 0.5 ? POSITION.INSIDE : null;
            return start || end || inside;
        }
        default:
            console.warn(`Неизвестный тип: ${type}`);
            break;
    }
};

const getElementsAtPosition = position => {
    return getElements()
        .map(element => ({ ...element, position: positionWithinElement(position, element) }))
        .filter(element => element.position != null);
};

const getMousePosition = event => {
    let { x, y } = event;
    return toWorld(x, y);
};

const toWorld = (x, y) => {
    const scale = getScale();
    const panOffset = getPanOffset();
    return {
        x: Math.trunc((x - panOffset.x) / scale),
        y: Math.trunc((y - panOffset.y) / scale)
    };
}

const toScreen = (x, y) => {
    const scale = getScale();
    const panOffset = getPanOffset();
    return {
        x: Math.trunc(x * scale + panOffset.x),
        y: Math.trunc(y * scale + panOffset.y)
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
    //document.getElementById("text").onchange = () => setTool(TOOLS.TEXT);

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
            context.strokeStyle = "#7572DE";
            context.lineWidth = 1;
            const distance = 5;
            const rectWidth = 10;
            switch (type) {
                case TOOLS.LINE:
                case TOOLS.ARROW: {
                    context.rect(x1 - distance, y1 - distance, rectWidth, rectWidth);
                    context.rect(x2 - distance, y2 - distance, rectWidth, rectWidth);
                    break;
                }
                case TOOLS.TEXT: {
                    break;
                }
                case TOOLS.RECTANGLE: {
                    const width = x2 - x1;
                    const height = y2 - y1;
                    context.rect(x1 - distance, y1 - distance, width + distance * 2, height + distance * 2);
                    context.rect(x1 - rectWidth, y1 - rectWidth, rectWidth, rectWidth);
                    context.rect(x2, y1 - rectWidth, rectWidth, rectWidth);
                    context.rect(x1 - rectWidth, y2, rectWidth, rectWidth);
                    context.rect(x2, y2, rectWidth, rectWidth);
                    break;
                }
                case TOOLS.SELECTION:
                default:
                    console.warn(`Неизвестный тип: ${type}`);
                    break;
            }
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
        const mousePosition = getMousePosition(event);
        const tool = getTool();
        if (event.button == MOUSEBUTTONS.SCROLLWHEEL && (getState() == STATE.UNFOCUSED || getState() == STATE.PANNING)) {
            canvas.style.cursor = "grab";
            setState(STATE.PANNING);
            setMouseOffset(mousePosition.x, mousePosition.y);
            return;
        }
        switch (tool) {
            case TOOLS.SELECTION: {
                const elements = getElementsAtPosition(mousePosition);
                if (elements.length > 0) {
                    let selectedElement = getSelectedElement();
                    let hadSelectedElement = true;
                    if (!selectedElement) {
                        const element = elements.find(element => {
                            if (element.type == TOOLS.ARROW || element.type == TOOLS.LINE) {
                                return true;
                            }
                            return element.position != POSITION.INSIDE;
                        });
                        selectedElement = selectElement(element);
                        hadSelectedElement = false;
                    }
                    if (selectedElement) {
                        selectedElement.position = positionWithinElement(mousePosition, selectedElement);
                        if (selectedElement.position) {
                            const { coordinates, position } = selectedElement;
                            selectedElement.mouseOffset = {
                                x: mousePosition.x - coordinates.x1,
                                y: mousePosition.y - coordinates.y1
                            }
                            if (position == POSITION.INSIDE || !hadSelectedElement) {
                                setState(STATE.MOVING);
                            } else {
                                if (position == POSITION.TOPRIGHT || position == POSITION.RIGHTLINE) {
                                    selectedElement.mouseOffset.x = mousePosition.x - coordinates.x2;
                                } else if (position == POSITION.BOTTOMRIGHT) {
                                    selectedElement.mouseOffset.x = mousePosition.x - coordinates.x2;
                                    selectedElement.mouseOffset.y = mousePosition.y - coordinates.y2;
                                } else if (position == POSITION.BOTTOMLEFT || position == POSITION.BOTTOMLINE) {
                                    selectedElement.mouseOffset.y = mousePosition.y - coordinates.y2;
                                }
                                setState(STATE.RESIZING);
                            }
                        } else {
                            selectElement(null);
                        }
                    }
                } else {
                    selectElement(null);
                }
                break;
            }
            case TOOLS.TEXT:
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
                    type: tool
                }
                createElement(element);
                selectElement(element);
                if (tool == TOOLS.TEXT) {
                    element.text = "";
                    setState(STATE.WRITING);
                } else {
                    setState(STATE.DRAWING);
                }
                break;
            }
            default:
                console.warn(`Неизвестный аргумент: ${tool}`);
                break;
        }
    });

    window.addEventListener("mousemove", event => {
        const mousePosition = getMousePosition(event);
        const state = getState();
        const tool = getTool();
        switch (state) {
            case STATE.UNFOCUSED: {
                if (tool == TOOLS.SELECTION) {
                    const selectedElement = getSelectedElement();
                    if (selectedElement) {
                        selectedElement.position = positionWithinElement(mousePosition, selectedElement);
                        canvas.style.cursor = mouseAtPosition(selectedElement.position);
                    } else {
                        const elements = getElementsAtPosition(mousePosition).filter(element => {
                            if (element.type == TOOLS.ARROW || element.type == TOOLS.LINE) {
                                return true;
                            }
                            return element.position != POSITION.INSIDE;
                        });
                        canvas.style.cursor = elements.length == 0 ? "default" : "move";
                    }
                }
                break;
            }
            case STATE.DRAWING: {
                canvas.style.cursor = "crosshair";
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
            case STATE.MOVING: {
                const element = getSelectedElement();
                const { coordinates, mouseOffset } = element;
                const width = coordinates.x2 - coordinates.x1;
                const height = coordinates.y2 - coordinates.y1;
                coordinates.x1 = mousePosition.x - mouseOffset.x;
                coordinates.y1 = mousePosition.y - mouseOffset.y;
                coordinates.x2 = mousePosition.x - mouseOffset.x + width;
                coordinates.y2 = mousePosition.y - mouseOffset.y + height;
                break;
            }
            case STATE.RESIZING: {
                const element = getSelectedElement();
                resizeCoordinates(mousePosition, element);
                if (element.type == TOOLS.RECTANGLE) {
                    adjustCoordinates(element);
                }
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

    window.addEventListener("mouseup", event => {
        canvas.style.cursor = "default";
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
                    const { coordinates } = element;
                    const width = Math.abs(coordinates.x2 - coordinates.x1);
                    const height = Math.abs(coordinates.y2 - coordinates.y1);
                    if (width <= 2 && height <= 2) {
                        deleteElement(element.id);
                        break;
                    }
                    if (element.type == TOOLS.RECTANGLE) {
                        adjustCoordinates(element);
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