document.addEventListener('keydown', function(event) {
    if (event.key === 't' || event.key === 'T') {
        var tramModeCheckbox = document.getElementById('tramMode');
        tramModeCheckbox.checked = !tramModeCheckbox.checked;
        tramModeCheckbox.dispatchEvent(new Event('change'));        
    }
});