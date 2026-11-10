class NotificationList extends HTMLElement {
    constructor() {
        super();
        this._notifications = [];
    }

    set data(items) {
        this._notifications = items.slice(0, 1);
        
        this.render();
    }

    render() {
        if (!this._notifications || this._notifications.length === 0) {
            this.innerHTML = `<p class="empty">No new notifications.</p>`;
            return;
        }

        this.innerHTML = `
            <div class="notification-group">
                ${this._notifications.map(notif => `
                    <div class="notification-item ${notif.isRead ? 'read' : 'unread'}">
                        <div class="notif-content">
                            <h3>${notif.title}</h3>
                            <p>${notif.message}</p>
                        </div>
                        <span class="notif-status">${notif.created_at} • ${notif.isRead ? 'read' : 'unread'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

customElements.define("notification-list", NotificationList);