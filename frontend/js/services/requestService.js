import { residents } from "../mock-data/resident.js";
import { requests } from "../mock-data/request.js";
import { documents } from "../mock-data/document.js";
import { notifications } from "../mock-data/notification.js";
import { announcements } from "../mock-data/announcement.js";
import { requestStatusHistory } from "../mock-data/requestStatusHistory.js";

export async function getRequests() {
    return requests;
}

export async function getRequestsWithDocuments() {
    return requests.map(request => {
        const document = documents.find(
            doc => doc.document_id === request.document_id
        );

        return {
            ...request,
            document_name: document?.document_name ?? "Unknown Document",
            description: document?.description ?? "Unknown Description",
            document_fee: document?.fee ?? 0
        };
    });
}

export async function getNotificationOne() {
    return notifications;
}

export async function getAnnouncementOne() {
    return announcements;
}

export async function getResidentInfo() {
    return residents;
}

export async function getRequestStatusHistory(requestId) {
    return requestStatusHistory
        .filter(history => history.request_id === requestId)
        .sort((a, b) =>
            new Date(a.changed_at) - new Date(b.changed_at)
        );
}