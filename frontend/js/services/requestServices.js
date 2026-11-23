import { API_BASE_URL } from "../config/apiConfig.js";

export async function submitDocumentRequest(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/requests`, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(
                data.message || "Unable to submit document request"
            );

            error.status = response.status;
            error.data = data;

            throw error;
        }

        return data;
    } catch (error) {
        console.error("Submit document request error:", error);
        throw error;
    }
}

export async function getDocumentRequirements(documentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/requests/${documentId}/requirements`, {
            method: "GET",
            credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve document requirements"
            );
        }

        return data.requirements;
    } catch (error) {
        console.error("Get document requirements error:", error);
        throw error;
    }
}

export async function getDocumentDetails(documentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve document details."
            );
        }

        return data.document;
    } catch (error) {
        console.error("Get document details error:", error);
        throw error;
    }
}

export async function getAvailableDocuments() {
    try {
        const response = await fetch(`${API_BASE_URL}/documents/available`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve available documents."
            );
        }

        return data.documents;
    } catch (error) {
        console.error("Get available documents error:", error);
        throw error;
    }
}

export async function getDocumentsWithRequirements() {
    try {
        const response = await fetch(`${API_BASE_URL}/documents/`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve documents."
            );
        }

        const documents = Array.isArray(data.documents)
            ? data.documents
            : [];

        const documentsWithRequirements = await Promise.all(
            documents.map(async documentInfo => {
                const requirements = await getDocumentRequirements(
                    documentInfo.document_id
                );

                return {
                    ...documentInfo,
                    requirements
                };
            })
        );

        return documentsWithRequirements;

    } catch (error) {
        console.error("Get documents with requirements error:", error);
        throw error;
    }
}

export async function getRequestsWithDocuments() {
    try {
        const response = await fetch(`${API_BASE_URL}/requests/my-requests`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(
                data.message || "Unable to retrieve your document requests."
            );

            error.status = response.status;
            throw error;
        }

        return data.requests;

    } catch (error) {
        console.error("Get resident requests error:", error);
        throw error;
    }
}

export async function getRequestStatusHistory(requestId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/requests/${requestId}/history`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve request status history."
            );
        }

        return Array.isArray(data.history) ? data.history : [];

    } catch (error) {
        console.error("Get request status history error:", error);
        throw error;
    }
}