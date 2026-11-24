const API_BASE_URL = "http://127.0.0.1:3000/api/documents";

// Retrieve all documents with their requirements
export async function getDocuments() {
    const response = await fetch(`${API_BASE_URL}/`, {
        method: "GET",
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to retrieve documents.");
    }

    return data.documents;
}

export async function getDocumentDetails(documentId) {
    const response = await fetch(`${API_BASE_URL}/${documentId}`, {
        method: "GET",
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to retrieve requirements.");
    }

    return {
        ...data.document,
        requirements: data.requirements
    };
}

// add a document with its requirements
export async function addDocument(documentData) {
    const formData = new FormData();

    formData.append("document_name", documentData.document_name);
    formData.append("description", documentData.description);
    formData.append("fee_per_copy", documentData.fee_per_copy);
    formData.append("availability", documentData.availability);

    formData.append(
        "requirements",
        JSON.stringify(documentData.requirements)
    );

    if (documentData.document_preview) {
        formData.append(
            "document_preview",
            documentData.document_preview
        );
    }

    const response = await fetch(`${API_BASE_URL}/`, {
        method: "POST",
        credentials: "include",
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to add document.");
    }

    return data;
}

export async function updateDocument(documentId, documentData) {
    const formData = new FormData();

    formData.append("document_name", documentData.document_name);
    formData.append("description", documentData.description);
    formData.append("fee_per_copy", documentData.fee_per_copy);
    formData.append("availability", documentData.availability);

    if (documentData.document_preview) {
        formData.append("document_preview", documentData.document_preview);
    }
    
    const response = await fetch(`${API_BASE_URL}/${documentId}`, {
        method: "PUT",
        credentials: "include",
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to update document.");
    }

    return data;
}

export async function addRequirement(documentId, requirementData) {
    const response = await fetch(`${API_BASE_URL}/${documentId}/requirements`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requirementData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to add requirement");
    }

    return data;
}

export async function updateRequirement(documentId, requirementId, requirementData) {
    const response = await fetch(`${API_BASE_URL}/${documentId}/requirements/${requirementId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requirementData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to update requirement");
    }

    return data;
}

export async function deleteRequirement(documentId, requirementId) {
    const response = await fetch(`${API_BASE_URL}/${documentId}/requirements/${requirementId}`, {
        method: "DELETE",
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to delete requirement");
    }

    return data;
}

export async function deleteDocument(documentId) {
    const response = await fetch(`${API_BASE_URL}/${documentId}`, {
        method: "DELETE",
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to delete document");
    }

    return data;
}

