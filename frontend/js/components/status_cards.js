const requestSummaryConfig = [
    { key: "Pending", label: "Pending", icon: "Status Card Pending.png" },
    { key: "Approved", label: "Approved", icon: "Status Card Approved.png" },
    { key: "Rejected", label: "Rejected", icon: "Status Card Rejected.png" },
    { key: "Released", label: "Released", icon: "Status Card Box.png" }
];

function countByStatus(items) {
    return {
        Pending: items.filter(item => item.status === "Pending" || item.status === "Under Review").length,
        Approved: items.filter(item => item.status === "Approved").length,
        Rejected: items.filter(item => item.status === "Rejected").length,
        Released: items.filter(item => item.status === "Released").length
    };
}

class StatusCards extends HTMLElement {
    constructor() {
        super();
        this._statuslist = [];
    }

    set data(items) {
        this._statuslist = items;
        this.render();
    }

    get data() {
        return this._statuslist;
    }

    connectedCallback() {
        if (this._statuslist.length === 0) {
            this.innerHTML = `<p class="loading">Loading your request summary...</p>`;
        }
    }

    render() {
        if (!this._statuslist || this._statuslist.length === 0) {
            this.innerHTML = `<p>No requests have been made.</p>`;
            return;
        }

        const statusCounts = countByStatus(this._statuslist);

        const cardsHTML = requestSummaryConfig.map(config => {
            const count = statusCounts[config.key] || 0;
            const iconPath = new URL(`../../assets/icons/Resident Portal/Overview Page/${config.icon}`, import.meta.url).href;

            return `
                <div class="status-card">
                    <img src="${iconPath}" alt="${config.label}">
                    <h2>${count}</h2>
                    <p>${config.label}</p>
                </div>
            `;
        }).join("");

        // Render cards into component wrapper
        this.innerHTML = `
            <div class="status-cards-container">
                ${cardsHTML}
            </div>
        `;
    }
}

customElements.define("status-cards", StatusCards);