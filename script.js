function nameFunc(){
    var audio = new Audio('fart.mp3');
    audio.play();
}

function goToUrl(url) {
    window.location.href = url;
}

function saveElementAsJPG(elementId, fileName = 'screenshot.jpg') {
    const element = document.getElementById(elementId);
    
    html2canvas(element, {
        useCORS: true, // Allow cross-origin images
        backgroundColor: null, // Capture the background color
        allowTaint: true, // Allow tainted images
        scale: 2, // Optional: Scale for higher resolution
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg');
        link.download = fileName;
        link.click();
    }).catch(err => {
        console.error("Error capturing the element:", err);
    });
}
