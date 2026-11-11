class Timestamp extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="timestamp">
                <img src="../../assets/icons/Resident Portal/Overview Page/Time (blue).png">
                <div class="date-time">
                    <h5 id="current-date"></h5>
                    <p id="current-day"></p>
                    <p id="current-time"></p>
                </div>
            </div>
        `;
    }
}

customElements.define('app-timestamp', Timestamp);

function updateTimestamp() {
    const dateElement = document.getElementById("current-date");
    const dayElement = document.getElementById("current-day");
    const timeElement = document.getElementById("current-time");

    if (!dateElement || !timeElement) return;

    const now = new Date();

    // Format Date: e.g., "Oct 24, 2026"
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', dateOptions);
    
    const dayOption = { weekday: 'long' }
    dayElement.textContent = now.toLocaleDateString('en-US', dayOption);

    // Format Time: e.g., "10:45:02 AM"
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    timeElement.textContent = now.toLocaleTimeString('en-US', timeOptions);
}

// 1. Initial run to avoid blank text on load
updateTimestamp();

// 2. Update every 1000 milliseconds (1 second)
setInterval(updateTimestamp, 1000);