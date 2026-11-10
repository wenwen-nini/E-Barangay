import { documents } from "../mock-data/document.js";

class RecentRequests extends HTMLElement {
    constructor() {
        super();
        this._requests = [];
    }

    set data(items) {
        this._requests = items.slice(0, 3);
        
        this.render();
    }

    render() {
        if (!this._requests || this._requests.length === 0) {
            this.innerHTML = `<p>No recent requests found.</p>`;
            return;
        }

        let userDocuments = [];
        this._requests.forEach(request => {
            const doc = documents.find(d => d.document_id === request.document_id)
            if (doc) userDocuments.push(doc);
        });

        this.innerHTML = `
            <div class="recent-requests-list">
                ${userDocuments.map(req => `
                        <div class="name-status-line">
                            <h4>${req.document_name}</h4>
                            <h5>Approved</h5>
                        </div>
                        <p class="request-date-and-id">DOC-00${req.document_id}• November 16, 2026</p>
                        <p>Your request has been approved. Visit the barangay hall for payment, if applicable, and document release.</p>
                `).join('')}
            </div>
        `;
    }
}

customElements.define("recent-requests-cards", RecentRequests);