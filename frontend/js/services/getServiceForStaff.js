import { API_BASE_URL } from "../config/apiConfig.js";

export async function getAnnouncement() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/announcements/staff/all`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve staff announcements."
            );
        }

        return data.announcements || [];

    } catch (error) {
        console.error("Get staff announcements error:", error);
        throw error;
    }
}

export async function getStaffRequestSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/requests/staff/summary`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve staff request summary"
            );
        }

         return data.summary
    } catch (error) {
        console.error("Get request summary error:", error);
        throw error;
    }
}

export async function getRequestsWithDocuments() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/requests/staff/all`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve staff requests."
            );
        }

        return data.requests || [];

    } catch (error) {
        console.error("Get staff requests error:", error);
        throw error;
    }
}

export async function getStaffRequestDetails(requestId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/requests/staff/${requestId}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve request details."
            );
        }

        return data.request;

    } catch (error) {
        console.error("Get staff request details error:", error);
        throw error;
    }
}


async function updateStaffRequestStatus(requestId, action, remarks = "") {
    try {
        const response = await fetch(
            `${API_BASE_URL}/requests/staff/${requestId}/${action}`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ remarks })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to update request status."
            );
        }

        return data;

    } catch (error) {
        console.error("Update staff request status error:", error);
        throw error;
    }
}

export async function markRequestUnderReview(requestId, remarks) {
    return updateStaffRequestStatus(
        requestId,
        "under-review",
        remarks
    );
}

export async function returnRequest(requestId, remarks) {
    return updateStaffRequestStatus(
        requestId,
        "return",
        remarks
    );
}

export async function approveRequest(requestId, remarks) {
    return updateStaffRequestStatus(
        requestId,
        "approve",
        remarks
    );
}

export async function rejectRequest(requestId, remarks) {
    return updateStaffRequestStatus(
        requestId,
        "reject",
        remarks
    );
}


export async function verifyUploadedRequirement(
    requestId,
    uploadedRequirementId,
    verificationStatus,
    remarks = null
) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/requests/staff/${requestId}/requirements/${uploadedRequirementId}/verify`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    verification_status: verificationStatus,
                    remarks
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to verify uploaded requirement."
            );
        }

        return data;

    } catch (error) {
        console.error("Verify uploaded requirement error:", error);
        throw error;
    }
}

