class Timestamp extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="timestamp">
                <img src="../../assets/icons/Resident Portal/Overview Page/Time (blue).png">
                <div class="date-time">
                    <p>timestamp placeholder</p>
                </div>
            </div>
        `;
    }
}

customElements.define('app-timestamp', Timestamp);