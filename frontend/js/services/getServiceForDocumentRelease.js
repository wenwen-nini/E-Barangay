import { API_BASE_URL } from "../config/apiConfig.js";

async function handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

// Retrieve Approved and Released requests
export async function getDocumentReleaseRequests(page = 1, filters = {}) {
    const params = new URLSearchParams({
        page: String(page)
    });

    if (filters.search) {
        params.append("search", filters.search);
    }

    if (filters.documentId) {
        params.append("document_id", filters.documentId);
    }

    if (filters.dateFrom) {
        params.append("date_from", filters.dateFrom);
    }

    if (filters.dateTo) {
        params.append("date_to", filters.dateTo);
    }

    const response = await fetch(
        `${API_BASE_URL}/requests/staff/document-release?${params.toString()}`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    return handleResponse(response);
}

// Retrieve selected request details
export async function getDocumentReleaseDetails(requestId) {
    const response = await fetch(
        `${API_BASE_URL}/requests/staff/document-release/${requestId}`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    return handleResponse(response);
}

// Save an individual verification checkbox
export async function updateReleaseVerification(
    requestId,
    field,
    value
) {
    const response = await fetch(
        `${API_BASE_URL}/requests/staff/document-release/${requestId}/verification`,
        {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                field,
                value: value ? 1 : 0
            })
        }
    );

    return handleResponse(response);
}

// Mark a document as Released
export async function releaseRequest(requestId) {
    const response = await fetch(
        `${API_BASE_URL}/requests/staff/document-release/${requestId}/release`,
        {
            method: "PATCH",
            credentials: "include"
        }
    );

    return handleResponse(response);
}

// Retrieve the Recent Release Log
export async function getRecentReleaseLog() {
    const response = await fetch(
        `${API_BASE_URL}/requests/staff/document-release/recent-log`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    return handleResponse(response);
}
