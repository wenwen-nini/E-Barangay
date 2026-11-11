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
                <div class="notification-list">
                    ${this._notifications.map(notif => `
                        <div class="notification-item ${notif.isRead ? 'read' : 'unread'}">
                            <div class="notif-content">
                                <div class="notif-card-header">
                                    <img src="../../assets/icons/Resident Portal/Overview Page/Notification.png" alt="Notif Icon" class="notif-icon">
                                    <h4>${notif.title || 'System Alert'}</h4>
                                </div>
                                <p class="notif-message">${notif.message}</p>
                            </div>

                            <div class="notif-status">
                                <span class="notif-date">${notif.created_at || 'Just now'}</span>
                                <span class="status-pill ${notif.isRead ? 'read' : 'unread'}">
                                    ${notif.isRead ? 'Read' : 'Unread'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

customElements.define("notification-list", NotificationList);