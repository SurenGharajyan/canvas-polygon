let canvas,
    context,
    polygonContent,
    polygonInputName,
    polygonSubmit,
    polygonsList,
    exportCSVBtn,
    polygonDelete,
    uploadInput;
let disableCanvas = false;
let coords = [];
let polygons = [];
let selectedDot = null;
let DOT_RADIUS = 5;
init();

function init() {
    this.initContent();
    this.initEvents();
}

function translatedX(x) {
    var rect = canvas.getBoundingClientRect();
    var factor = canvas.width / rect.width;
    return Math.round(factor * (x - rect.left));
}

function translatedY(y) {
    var rect = canvas.getBoundingClientRect();
    var factor = canvas.width / rect.width;
    return Math.round(factor * (y - rect.top));
}

function initContent() {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    uploadInput = document.getElementById('uploadInput');
    polygonContent = document.getElementById('polygonContent');
    polygonInputName = document.getElementById('polygonInputName');
    polygonsList = document.getElementById('polygonsList');
    this.initButtons();

    [canvas.width, canvas.height] = [window.innerWidth, '400'];
}

function initButtons() {
    polygonSubmit = document.getElementById('polygonSave');
    exportCSVBtn = document.getElementById('exportCSVBtn');
    polygonDelete = document.getElementById('polygonDelete');
}

function initEvents() {
    window.onresize = () => {
        [canvas.width, canvas.height] = [window.innerWidth, '400'];
        this.recreateAllCanvasIncludes();
    }
    canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));

    polygonSubmit.addEventListener('click', this.handleSavePolygonInfo.bind(this));
    polygonDelete.addEventListener('click', this.handleDeleteCreatedPolygon.bind(this));
    exportCSVBtn.addEventListener('click', this.expertAsCSV.bind(this));

    uploadInput.addEventListener('change', this.uploadCSV.bind(this))
}

function polygonSettingsVisible(show) {
    show
        ? polygonContent.classList.remove('none')
        : polygonContent.classList.add('none');
}

function recreateAllCanvasIncludes() {
    this.clearCanvas();
    polygons.forEach(polygon => this.renderCanvas(polygon.coords));
    this.renderCanvas(coords);
}

function handleCanvasClick(event) {
    if (disableCanvas) {
        return;
    }
    if (selectedDot?.polygonInfo) {
        selectedDot = null;
        return;
    }

    coords.push([translatedX(event.clientX), translatedY(event.clientY)]);
    this.recreateAllCanvasIncludes();
    if (coords.length === 4) {
        disableCanvas = true;
        this.polygonSettingsVisible(true);
    }

}

function handleCanvasMouseDown($event) {
    if (disableCanvas) {
        return;
    }
    selectedDot = null;
    let dotIndex = null;
    let polygonIndex = null;
    const findPolygon = polygons.find((polygon, index) => {
        polygonIndex = index;
        dotIndex = this.getClickedDotIndex(polygon.coords, {
            x: translatedX($event.clientX),
            y: translatedY($event.clientY)
        });
        return dotIndex !== -1;
    });

    selectedDot = {index: dotIndex, polygonInfo: findPolygon, polygonIndex};
}

function handleCanvasMouseMove($event) {
    if (disableCanvas) {
        return;
    }
    if (!selectedDot?.polygonInfo || !polygons.length) {
        return;
    }
    const coordOfSelectedDot = selectedDot.polygonInfo.coords[selectedDot.index];
    [coordOfSelectedDot[0], coordOfSelectedDot[1]] = [translatedX($event.clientX), translatedY($event.clientY)]
    this.updateSpanInfo(selectedDot.polygonInfo);
    this.clearCanvas();
    polygons.forEach(polygon => this.renderCanvas(polygon.coords));

}

function updateSpanInfo(polygon) {
    const span = document.querySelector('[data-index="' + selectedDot.polygonIndex + '"]');
    this.updateSpanCoordText(span, polygon);
}

function handleSavePolygonInfo($event) {
    if (polygonInputName.value === '') {
        return;
    }
    const name = polygonInputName.value;
    polygons.push({name, coords});
    this.createSpanForPolygon(polygons[polygons.length - 1], polygons.length - 1);
}

function createSpanForPolygon(polygon, index) {
    const spanPolygonInfo = this.createPolygonInfo(polygon, index);
    polygonsList.appendChild(spanPolygonInfo);
    this.resetPolygonSettings();
}

function resetPolygonSettings() {
    disableCanvas = false;
    this.polygonSettingsVisible(false);
    polygonInputName.value = '';
    coords = [];
}

function handleDeleteCreatedPolygon() {
    this.resetPolygonSettings();
    this.recreateAllCanvasIncludes(coords);
}

function updateSpanCoordText(span, polygon) {
    let positionText = '[ ';
    for (let i = 0; i < polygon.coords.length; i++) {
        positionText += JSON.stringify(polygon.coords[i]) + ' ';
    }
    positionText += ']';
    span.innerText = 'name: ' + '\"' + polygon.name + '\"' + ' position: ' + positionText;
}

function createPolygonInfo(polygon, index) {
    const span = document.createElement('span');
    span.setAttribute('data-index', index)
    this.updateSpanCoordText(span, polygon);
    return span;
}

function renderCanvas(coords) {
    context.strokeStyle = 'red';
    context.lineWidth = 1;
    for (let i = 0; i < coords.length; i++) {
        context.beginPath();
        context.fillStyle = 'red';
        context.arc(coords[i][0], coords[i][1], DOT_RADIUS, 0, 2 * Math.PI);
        context.moveTo(coords[i][0], coords[i][1]);
        context.fill();

        if (i < coords.length - 1) {
            context.lineTo(coords[i + 1][0], coords[i + 1][1]);
        }
        if (coords.length === 4 && i === coords.length - 1) {
            context.lineTo(coords[0][0], coords[0][1]);
        }
        context.stroke();
        context.closePath();
    }
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function getClickedDotIndex(coords, clickCoord) {
    return coords.findIndex(coord =>
        (coord[0] - DOT_RADIUS <= clickCoord.x && coord[0] + DOT_RADIUS >= clickCoord.x)
        && (coord[1] - DOT_RADIUS <= clickCoord.y && coord[1] + DOT_RADIUS >= clickCoord.y)
    );
}

function expertAsCSV() {
    if (!polygons.length) {
        return;
    }
    let csv = '';
    for (let row = 0; row < polygons.length; row++) {
        let keysAmount = Object.keys(polygons[row]).length
        let keysCounter = 0
        if (row === 0) {
            for (let key in polygons[row]) {
                csv += key + (keysCounter + 1 < keysAmount ? ',' : '\r\n');
                keysCounter++
            }
            keysCounter = 0;
            for (let key in polygons[row]) {
                csv += polygons[row][key] + (keysCounter + 1 < keysAmount ? ',' : '\r\n');
                keysCounter++
            }
        } else {
            for (let key in polygons[row]) {
                csv += polygons[row][key] + (keysCounter + 1 < keysAmount ? ',' : '\r\n');
                keysCounter++
            }
        }

        keysCounter = 0;
    }
    let link = document.createElement('a');
    link.id = 'download-csv'
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
    link.setAttribute('download', 'coordinates.csv');
    document.body.appendChild(link)
    document.querySelector('#download-csv').click()
}

function uploadCSV() {
    const file = uploadInput.files[0];
    if (file) {

        const reader = new FileReader();

        reader.addEventListener(
            'load',
            (event) => {
                const newLineBreak = event.target.result.split("\n");
                newLineBreak.forEach(simpleLine => {
                    const line = simpleLine
                        .split(",")
                        .map((simpleLine, index) => index !== 0 ? +simpleLine : simpleLine);
                    const isAllValid = line.every(l => !!l);
                    if (isAllValid) {
                        const coordsInUnit = line
                            .splice(1, line.length - 1)
                        const coords = [];
                        coordsInUnit.forEach((coord, index) => {
                            if (index % 2 === 1) {
                                coords.push([coordsInUnit[index - 1], coordsInUnit[index]]);
                            }
                        })

                        polygons.push({name: line[0], coords});
                        this.createSpanForPolygon(polygons[polygons.length - 1], polygons.length - 1)
                    }
                });
                if (polygons.length) {
                    this.recreateAllCanvasIncludes();
                } else {
                    alert('Something is incorrect. Please check the file');
                }
            }
        );
        reader.readAsBinaryString(file);
    }
}
