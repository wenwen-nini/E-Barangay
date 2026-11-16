import { requests } from "../mock-data/request.js";
import { documents } from "../mock-data/document.js";
import { residents } from "../mock-data/resident.js";
import { announcements } from "../mock-data/announcement.js";

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

export async function getAnnouncementOne() {
    return announcements;
}

export async function getResidentInfo() {
    return residents;
}

export async function recentRequestInfo() {
    const residents = await getResidentInfo();
    const request = await getRequestsWithDocuments();

    return request.map(req => {
        const resident = residents.find(
            res => res.resident_id === req.resident_id
        );

        return {
            ...req,
            first_name: resident?.first_name ?? "Unknown First Name",
            middle_name: resident?.middle_name ?? "Unknown Middle Name",
            last_name: resident?.last_name ?? "Unknown Last Name",
            name_extension: resident?.name_extension ?? ""
        };
    });
}
