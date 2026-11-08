import { requests } from "../../mock-data/request.js";

document.addEventListener("DOMContentLoaded", () => {
    const statusListElement = document.getElementById("status-list");

    if (statusListElement) {
        statusListElement.data = requests;
    }
});