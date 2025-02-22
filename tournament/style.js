document.addEventListener('DOMContentLoaded', styleUpdate);

function styleUpdate() {
    // Select all elements with the "animated-text" class (e.g. label, div, etc.)
    var elements = document.querySelectorAll('.typewriter');

    elements.forEach(function (el) {
        // Get the text content and clear the element
        var text = el.textContent;
        el.textContent = '';

        // Loop through each character and wrap it in a span
        for (var i = 0; i < text.length; i++) {
            var span = document.createElement('span');
            // If the character is a space, replace it with a non-breaking space
            if (text[i] === ' ') {
                span.innerHTML = '&nbsp;';
            } else {
                span.textContent = text[i];
            }
            // Set a staggered delay (ここで各文字に遅延を設定)
            span.style.animationDelay = (i * 0.05) + 's';
            el.appendChild(span);
        }
    });
}