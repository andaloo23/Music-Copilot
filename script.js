const noteLabels = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"];
const numLines = 47;
const leftPadding = 20;
const barWidth = 100;
const lineSpacing = 20;
const topPadding = 100;

document.addEventListener("DOMContentLoaded", function() {
    const linesContainer = document.querySelector(".lines");
    fillScreenWithLines(linesContainer);

    linesContainer.addEventListener('click', function(event) {
        if (event.shiftKey && event.button === 0) { // Left Click with Shift
            console.log("Shift + Left Click detected");
            createRectangle(event);
        }
    });

    window.addEventListener("resize", function() {
        fillScreenWithLines(linesContainer);
    });
});

function fillScreenWithLines(linesContainer) {
    linesContainer.innerHTML = '';

    // Total height from the first line to the last
    const totalHeight = lineSpacing * numLines;

    for (let i = 0; i < numLines; i++) {
        // Create line
        const line = document.createElement("div");
        line.classList.add("line");
        line.style.position = 'absolute';
        line.style.top = `${topPadding + lineSpacing * i}px`;
        line.style.width = "100%";
        linesContainer.appendChild(line);

        // Create label
        const label = document.createElement("div");
        label.classList.add("note-label");
        label.style.position = 'absolute';
        label.style.left = '0px';
        label.style.top = `${topPadding + lineSpacing * (numLines - i - 1)}px`;
        label.style.color = 'white';
        label.style.fontWeight = 'bold';
        label.textContent = noteLabels[i % noteLabels.length];
        linesContainer.appendChild(label);
    }

    // Adjustments for vertical line and bar dividers
    adjustVerticalLines(linesContainer, totalHeight);
}

function adjustVerticalLines(linesContainer, totalHeight) {
    const numBars = Math.floor(linesContainer.offsetWidth / barWidth);

    for (let j = 0; j <= numBars * 4; j++) {
        const vLine = document.createElement("div");
        vLine.classList.add("bar-divider");
        vLine.style.position = 'absolute';
        vLine.style.left = `${leftPadding + j * (barWidth / 4)}px`;
        vLine.style.top = `${topPadding}px`;
        vLine.style.height = `${totalHeight}px`;  // Extend down to cover all lines
        vLine.style.width = '1px';
        vLine.style.backgroundColor = j % 4 === 0 ? 'black' : 'rgba(255, 255, 255, 0.5)';
        linesContainer.appendChild(vLine);
    }
}

function createRectangle(event) {
    const linesContainer = document.querySelector(".lines");
    const sectionWidth = barWidth / 4;
    const rectangleHeight = lineSpacing - 2;

    let yPos = Math.floor((event.clientY + window.scrollY - linesContainer.offsetTop) / lineSpacing) * lineSpacing + 1;
    let xPos = Math.floor((event.clientX + window.scrollX - leftPadding) / sectionWidth) * sectionWidth + leftPadding + 1;

    // Calculate the index and note based on yPos.
    const lineIndex = numLines - Math.floor((yPos - topPadding) / lineSpacing) - 1;
    const octave = Math.floor(lineIndex / noteLabels.length) + 1;  // Add 1 to adjust octave numbering if needed
    const note = noteLabels[lineIndex % noteLabels.length];

    if (xPos > leftPadding && yPos > topPadding) {
        const rect = document.createElement('div');
        rect.classList.add('rectangle', 'draggable');
        rect.style.position = 'absolute';
        rect.style.top = `${yPos}px`;
        rect.style.left = `${xPos}px`;
        rect.style.height = `${rectangleHeight + 1}px`;
        rect.style.width = `${sectionWidth - 1}px`;

        console.log(note, octave);
        rect.setAttribute('data-note', note);
        rect.setAttribute('data-octave', octave);

        linesContainer.appendChild(rect);

        // Add drag handlers
        addDragHandlers(rect);

        // Add event handlers for interaction, passing the note and octave
        addRectangleEventHandlers(rect, note, octave);

        // Play the note as soon as the rectangle is created
        playNote(note, octave);

        // Deselect any currently selected rectangles and select the new one
        deselectAllRectangles();
        rect.classList.add('selected');  // This should visually show the selection immediately

        // Forcing the browser to recognize the style change
        window.getComputedStyle(rect).border;
    }
}

function playNote(note, octave) {
    const audioFilePath = getAudioFilePath(note, octave);
    const audio = new Audio(audioFilePath);
    audio.play().catch(e => console.error("Error playing audio: ", e));
}

function addDragHandlers(rect) {
    const resizeThreshold = 10; // Pixel range to trigger resize cursor
    const gridWidth = barWidth / 4; // Width of one grid section

    // Function to update cursor style based on position
    rect.onmousemove = function(event) {
        const rectBounds = rect.getBoundingClientRect();
        const isNearRightEdge = event.clientX >= rectBounds.right - resizeThreshold && event.clientX <= rectBounds.right;
        rect.style.cursor = isNearRightEdge ? 'e-resize' : 'move'; // 'e-resize' for resizing, 'move' for dragging
    };

    rect.onmousedown = function(event) {
        event.preventDefault(); // Prevent default drag interactions and text selection.

        const rectBounds = rect.getBoundingClientRect();
        const isNearRightEdge = event.clientX >= rectBounds.right - resizeThreshold && event.clientX <= rectBounds.right;
        const startX = event.clientX;
        const startY = event.clientY;
        const startLeft = rect.offsetLeft;
        const startTop = rect.offsetTop;
        const startWidth = rect.offsetWidth;

        function onMouseMove(event) {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;

            if (isNearRightEdge) {
                // Resizing the rectangle
                let newWidth = Math.max(startWidth + dx, gridWidth); // Enforce minimum grid width
                newWidth = Math.round(newWidth / gridWidth) * gridWidth; // Snap to grid width
                rect.style.width = `${newWidth - 1}px`;
            } else {
                // Moving the rectangle
                rect.style.left = `${startLeft + dx}px`;
                rect.style.top = `${startTop + dy}px`;
            }
        }

        document.addEventListener('mousemove', onMouseMove);

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            alignRectangle(rect); // Align to nearest grid on mouse up
            rect.style.cursor = ''; // Reset cursor style
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mouseup', onMouseUp);
    };

    rect.ondragstart = function() {
        return false;
    };
}

function alignRectangle(rect) {
    const linesContainer = document.querySelector(".lines");
    const gridWidth = barWidth / 4; // Width of one grid section

    // Snap rectangle top to the nearest line
    const topOffset = rect.offsetTop - linesContainer.offsetTop;
    const newTopIndex = Math.round(topOffset / lineSpacing);
    rect.style.top = `${linesContainer.offsetTop + newTopIndex * lineSpacing + 1}px`;

    // Snap rectangle left to the nearest grid section
    const leftOffset = rect.offsetLeft - leftPadding; 
    const newLeftIndex = Math.round(leftOffset / gridWidth);
    rect.style.left = `${20 + newLeftIndex * gridWidth + 1}px`;

    // Calculate the correct line index considering the offset error adjustment
    const lineIndex = numLines - newTopIndex - 1 + 5; // Adjust if necessary for top-to-bottom index inversion
    const octave = Math.floor(lineIndex / noteLabels.length) + 1; // Adjust octave numbering if needed
    const note = noteLabels[lineIndex % noteLabels.length];

    rect.setAttribute('data-note', note);
    rect.setAttribute('data-octave', octave);

    console.log(`Updated position -- Note: ${note}, Octave: ${octave}`);
}


function deselectAllRectangles() {
    document.querySelectorAll('.rectangle').forEach(function(rect) {
        rect.classList.remove('selected');
    });
}

document.addEventListener('click', function(event) {
    if (!event.target.classList.contains('rectangle')) {
        deselectAllRectangles(); // Deselect all rectangles if the clicked area is not a rectangle
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Backspace') {
        const selectedRect = document.querySelector('.rectangle.selected');
        if (selectedRect) {
            selectedRect.remove(); // Remove the selected rectangle from the DOM
        }
        console.log("delete");
    }
});

function getAudioFilePath(note, octave) {
    return `/Users/andrewliu/Documents/music\ copilot/piano-mp3/${note}${octave}.mp3`;
}

function addRectangleEventHandlers(rect) {
    rect.onclick = function(event) {
        event.stopPropagation();
        deselectAllRectangles();
        rect.classList.add('selected');
        const note = rect.getAttribute('data-note');
        const octave = rect.getAttribute('data-octave');
        playNote(note, octave);
    };
}

function playNote(note, octave) {
    const audioFilePath = getAudioFilePath(note, octave);
    let audio = new Audio(audioFilePath);
    audio.loop = false; // Ensure the note loops while the line is over the rectangle
    audio.play().catch(e => console.error("Error playing audio: ", e));
    return audio; // Return the audio object for control
}

const sweepLineInterval = { current: null };

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('playButton').addEventListener('click', startSweepLine);
    document.getElementById('resetButton').addEventListener('click', resetSweepLine);
});

function startSweepLine() {
    resetSweepLine(); // Ensure a clean state before starting
    const sweepLine = createSweepLine(); // Ensure sweep line is created or retrieved
    sweepLine.style.left = `${leftPadding}px`;
    sweepLine.style.display = 'block';

    const linesContainer = document.querySelector(".lines");
    const totalWidth = linesContainer.offsetWidth;
    let currentPosition = 0;

    window.sweepAnimation = setInterval(() => {
        currentPosition += 100 * (100 / 1000); // Move 100 pixels per second
        if (currentPosition >= totalWidth) {
            clearInterval(window.sweepAnimation);
            sweepLine.style.display = 'none';
        }
        sweepLine.style.left = `${leftPadding + currentPosition}px`;
        checkIntersections(sweepLine.getBoundingClientRect());
    }, 100);
}

function createSweepLine() {
    let sweepLine = document.getElementById('sweepLine');
    if (!sweepLine) {
        sweepLine = document.createElement('div');
        sweepLine.id = 'sweepLine';
        sweepLine.style.cssText = `position: absolute; top: ${topPadding}px; left: ${leftPadding}px; height: calc(100vh - ${topPadding}px); width: 2px; background-color: red; z-index: 2000; display: none;`;
        document.body.appendChild(sweepLine);
    }
    return sweepLine;
}

function resetSweepLine() {
    const sweepLine = document.getElementById('sweepLine');
    if (sweepLine) {
        sweepLine.style.display = 'none';
        sweepLine.style.left = `${leftPadding}px`;
    }
    if (window.sweepAnimation) {
        clearInterval(window.sweepAnimation);
    }
    resetNotes();
}

function resetNotes() {
    document.querySelectorAll('.rectangle').forEach(rect => {
        if (rect.dataset.isPlaying === 'true') {
            rect.dataset.isPlaying = 'false';
            if (rect.audio) {
                rect.audio.pause();
                rect.audio.currentTime = 0;
                rect.audio = null;
            }
        }
    });
}

function checkIntersections(sweepLineRect) {
    document.querySelectorAll('.rectangle').forEach(rect => {
        const rectBounds = rect.getBoundingClientRect();
        if (rectBounds.left < sweepLineRect.right && rectBounds.right > sweepLineRect.left) {
            if (rect.dataset.isPlaying !== 'true') {
                rect.dataset.isPlaying = 'true';
                rect.audio = playNote(rect.dataset.note, rect.dataset.octave);
            }
        } else {
            if (rect.dataset.isPlaying === 'true') {
                rect.dataset.isPlaying = 'false';
                if (rect.audio) {
                    rect.audio.pause();
                    rect.audio.currentTime = 0;
                    rect.audio = null;
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const linesContainer = document.querySelector(".lines");
    if (!linesContainer) return;

    let selectionBox = null;
    let startX = 0;
    let startY = 0;

    linesContainer.addEventListener('mousedown', function(event) {
        // Clear previous selections if not clicking on an existing rectangle
        if (!event.target.classList.contains('rectangle')) {
            const selectedRectangles = document.querySelectorAll('.rectangle.selected');
            selectedRectangles.forEach(rect => rect.classList.remove('selected'));
        }

        startX = event.clientX;
        startY = event.clientY;

        // Create the selection box
        selectionBox = document.createElement('div');
        selectionBox.style.position = 'absolute';
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.backgroundColor = 'rgba(0, 0, 255, 0.3)'; // Translucent blue
        selectionBox.style.border = '1px dashed #000'; // Dashed border
        linesContainer.appendChild(selectionBox);

        event.preventDefault(); // Prevent text selection
    });

    linesContainer.addEventListener('mousemove', function(event) {
        if (!selectionBox) return;

        const x = Math.min(event.clientX, startX);
        const y = Math.min(event.clientY, startY);
        const width = Math.abs(event.clientX - startX);
        const height = Math.abs(event.clientY - startY);

        selectionBox.style.left = `${x}px`;
        selectionBox.style.top = `${y}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
    });

    linesContainer.addEventListener('mouseup', function(event) {
        if (!selectionBox) return;

        // Get the bounds of the selection box
        const bounds = selectionBox.getBoundingClientRect();

        // Check for intersections with rectangles
        document.querySelectorAll('.rectangle').forEach(rect => {
            const rectBounds = rect.getBoundingClientRect();
            if (rectBounds.right > bounds.left && rectBounds.left < bounds.right &&
                rectBounds.bottom > bounds.top && rectBounds.top < bounds.bottom) {
                    rect.classList.add('selected');
            }
        });

        // Remove or reset the selection box after creation
        selectionBox.remove();
        selectionBox = null;
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const linesContainer = document.querySelector(".lines");
    const popup = createPopup();
    fillScreenWithLines(linesContainer);

    linesContainer.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        if (event.target.classList.contains('rectangle') && event.target.classList.contains('selected')) {
            // Position and show the popup
            popup.style.left = `${event.clientX}px`;
            popup.style.top = `${event.clientY}px`;
            popup.style.display = 'block';

            // Focus on the input inside the popup if needed
            const input = popup.querySelector('input');
            input.value = '';  // Clear previous text
            input.focus();
        } else {
            // Hide the popup if not clicking on a selected rectangle
            popup.style.display = 'none';
        }
    });

    document.addEventListener('click', function(event) {
        if (!popup.contains(event.target)) {
            popup.style.display = 'none';
        }
    });

    linesContainer.oncontextmenu = function(event) {
        event.preventDefault();  // Prevent the browser's context menu everywhere in the container
    };
});

function createPopup() {
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.border = '1px solid black';
    popup.style.padding = '10px';
    popup.style.backgroundColor = 'white';
    popup.style.display = 'none'; // Initially hidden
    popup.style.zIndex = '2000'; // Ensure it's on top

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter your message here';
    popup.appendChild(input);

    // Prevent keydown events from propagating to the global document handlers
    input.addEventListener('keydown', function(event) {
        event.stopPropagation();
    });

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send Data';
    sendButton.onclick = function() {
        const data = collectSelectedData();
        const message = input.value; // Get the input value
        sendDataToBackend(data, message);
        popup.style.display = 'none'; // Hide popup after sending data
    };
    popup.appendChild(sendButton);

    document.body.appendChild(popup);
    return popup;
}

function sendDataToBackend(data, message) {
    fetch('http://127.0.0.1:5000/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rectangles: data, message: message }) // Include the message in the JSON body
    })
    .then(response => response.json())
    .then(result => console.log('Success:', result))
    .catch(error => console.error('Error:', error));
}

function collectSelectedData() {
    const selectedRectangles = document.querySelectorAll('.rectangle.selected');
    const data = Array.from(selectedRectangles).map(rect => ({
        note: rect.getAttribute('data-note'),
        octave: rect.getAttribute('data-octave'),
        left: rect.style.left,
        top: rect.style.top,
        width: rect.style.width
    }));
    return data;
}
