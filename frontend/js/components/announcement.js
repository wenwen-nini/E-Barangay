class AnnouncementCard extends HTMLElement {
    constructor() {
        super();
        this._announcements = [];
    }

    set data(items) {
        this._announcements = items.slice(0, 1);
        
        this.render();
    }

    render() {
        if (!this._announcements || this._announcements.length === 0) {
            this.innerHTML = `<p class="empty">No announcements posted.</p>`;
            return;
        }

        this.innerHTML = `
            <div class="announcement-list">
                ${this._announcements.map(item => `
                    <div class="announcement-card">
                        <div class="announcement-header">
                            <h3>${item.title}</h3>
                            <span class="date">${item.published_at}</span>
                        </div>
                        <p>${item.content}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

customElements.define("announcement-card", AnnouncementCard);