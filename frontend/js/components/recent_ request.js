import { documents } from "../mock-data/document.js";

class RecentRequests extends HTMLElement {
    constructor() {
        super();
        this._requests = [];
    }

    set data(items) {
        this._requests = items.slice(0, 2);
        
        this.render();
    }

    render() {
        if (!this._requests || this._requests.length === 0) {
            this.innerHTML = `<p>No recent requests found.</p>`;
            return;
        }

        const userDocuments = this._requests.map(request => {
            const doc = documents.find(d => String(d.document_id) === String(request.document_id));
            return {
                ...doc,     
                ...request
            };
        });

        this.innerHTML = `
            <div class="recent-requests-list">
                ${userDocuments.map(req => {
                    const statusClass = getStatusClass(req.status);
                    const formattedId = `DOC-${String(req.request_id || req.document_id || 0).padStart(3, '0')}`;
                    const requestDate = req.date || req.created_at || 'Nov 16, 2026';
                    const statusMessage = getStatusMessage(req.status);

                    return `
                        <div class="request-card">
                            <div class="card-header">
                                <h4 class="document-name">${req.document_name || req.title || 'Barangay Document'}</h4>
                                <span class="status-badge ${statusClass}">${req.status || 'Pending'}</span>
                            </div>

                            <div class="request-meta">
                                <span class="request-id">${formattedId}</span>
                                <span class="dot-separator">•</span>
                                <span class="request-date">${requestDate}</span>
                            </div>

                            <p class="status-description">${statusMessage}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

function getStatusMessage(status) {
    switch (status) {
        case 'Approved':
            return 'Your request has been approved. Visit the barangay hall for payment, if applicable, and document release.';
        case 'Pending':
        case 'Under Review':
            return 'Barangay staff are currently reviewing your request details and supporting documents.';
        case 'Rejected':
            return 'Your request was not approved. Please check your notification details for reasons or resubmit requirements.';
        case 'Released':
            return 'This document has been successfully processed and released to you.';
        default:
            return 'Your document request is being processed.';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Approved': 
            return 'status-approved';
        case 'Pending': 
        case 'Under Review': 
            return 'status-pending';
        case 'Rejected': 
            return 'status-rejected';
        case 'Released': 
            return 'status-released';
        default: 
            return 'status-default';
    }
}

customElements.define("recent-requests-cards", RecentRequests);