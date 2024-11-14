function nameFunc(){
    var audio = new Audio('fart.mp3');
    audio.play();
}

function goToUrl(url) {
    window.location.href = url;
}

function openUrlInNewTab(url){
    window.open(url, '_blank').focus();
}

function saveElementAsJPG(elementId, fileName = 'screenshot.jpg') {
    const element = document.getElementById(elementId);
    
    html2canvas(element, {
        useCORS: true, // Allow cross-origin images
        backgroundColor: null, // Capture the background color
        allowTaint: true, // Allow tainted images
        scale: 1, // Optional: Scale for higher resolution
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg');
        link.download = fileName;
        link.click();
    }).catch(err => {
        console.error("Error capturing the element:", err);
    });
}

function saveElementAsMultipleJPGs(elementId, fileName = 'final-board-part', maxHeight = 20000) {
    const element = document.getElementById(elementId);
    const elementHeight = element.scrollHeight; // Total height of the element
    const totalParts = Math.ceil(elementHeight / maxHeight); // Number of images to split into

    let currentPart = 0; // Track the part being captured
    let offsetY = 0; // Vertical offset for scrolling

    function capturePart() {
        html2canvas(element, {
            useCORS: true,
            backgroundColor: null,
            y: offsetY,
            height: Math.min(maxHeight, elementHeight - offsetY), // Limit the capture area
            windowHeight: maxHeight, // Limit the canvas size
        }).then(canvas => {
            // Create file name for each part
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg');
            link.download = `${fileName}${currentPart + 1}.jpg`;
            link.click();

            // Move to the next part
            currentPart++;
            offsetY += maxHeight;

            // If there are more parts to capture, call capturePart recursively
            if (currentPart < totalParts) {
                capturePart();
            }
        }).catch(err => {
            console.error("Error capturing the element:", err);
        });
    }

    capturePart(); // Start capturing the first part
}

let isAltPressed = false;

window.addEventListener("keydown", (event) => {
    if (event.key === "Alt") {
        isAltPressed = true;
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key === "Alt") {
        isAltPressed = false;
    }
});