import { recentRequestInfo } from "../../services/getServiceForStaff.js";

let currentStatus = "All";
let searchQuery = "";
const requestData = await recentRequestInfo();
console.log(requestData);

const tableBody = document.getElementById("table-body");
const searchInput = document.querySelector("#search-input");
const tabButtons = document.querySelectorAll("#tab-btn");

async function renderTable() {
    const filteredData = requestData.filter(item => {
        const residentName = `${item.first_name} ${item.middle_name.charAt(0)} ${item.last_name} ${item.name_extension ? `${item.name_extension}` : ""}`; 

        const matchedStatus = (currentStatus === "All") || (item.status === currentStatus);
        const matchesSearch = residentName.toLowerCase().includes(searchQuery.toLowerCase()) || item.resident_id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchedStatus && matchesSearch;
    });

    const htmlRows = filteredData.map(item => `
        <tr>
            <td>#${item.request_id}</td>
            <td><strong>${item.first_name} ${item.middle_name.charAt(0)} ${item.last_name} ${item.name_extension ? `${item.name_extension}` : ""}</strong></td>
        `);
}

