function nameFunc(){
    var audio = new Audio('fart.mp3');
    audio.play();
}

const getMeta = (url, cb) => {
    const img = new Image();
    img.onload = () => cb(null, img);
    img.onerror = (err) => cb(err);
    img.src = url;
};

function scrollToElement(id){
    document.getElementById(id).scrollIntoView({ behavior: "smooth", block: "center" });
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
    const elementHeight = element.scrollHeight;
    const totalParts = Math.ceil(elementHeight / maxHeight);
    let currentPart = 0;
    let offsetY = 0;

    function capturePart() {
        html2canvas(element, {
            useCORS: true,
            backgroundColor: null,
            y: offsetY,
            height: Math.min(maxHeight, elementHeight - offsetY),
            windowHeight: maxHeight,
            onclone: (clonedDoc) => {
                // Find all animated elements in the cloned document
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                    // Force all animated elements to their final state
                    clonedElement.querySelectorAll('*').forEach(el => {
                        el.style.animation = 'none';
                        el.style.opacity = '1';
                    });
                    clonedElement.style.animation = 'none';
                    clonedElement.style.opacity = '1';
                }
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg');
            link.download = `${fileName}${currentPart + 1}.jpg`;
            link.click();

            currentPart++;
            offsetY += maxHeight;

            if (currentPart < totalParts) {
                capturePart();
            }
        }).catch(err => {
            console.error("Error capturing the element:", err);
        });
    }

    capturePart();
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

window.addEventListener('focus', () => {
    isAltPressed = false;
});

function toggleTheme(){
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Save theme
}









// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
}else{
    document.documentElement.setAttribute('data-theme', 'dark'); // Default theme
}