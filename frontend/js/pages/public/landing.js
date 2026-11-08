import { documents } from "../../mock-data/document.js";

const documentIcons = {
    "Barangay Clearance": "Barangay Clearance (landing page).png",
    "Certificate of Residency": "Certificate of Residency (landing page).png",
    "Certificate of Indigency": "Certificate of Indigency (landing page).png",
    "Barangay Business Clearance": "Barangay Business Clearance (landing page).png",
    "Certificate of Good Moral Character": "Certificate of Good Moral Character (landing page).png",
    "Barangay Certification": "Barangay Certification (landing page).png"
};

const documentList = document.getElementById("document-list");

function displayDocuments(data) {

    
    documentList.innerHTML = "";

    data.forEach(item => {

        const icon = documentIcons[item.document_name];

        const card = document.createElement("div");

        card.classList.add("document-card");

        card.innerHTML = `

            <img src="../../../../E-Barangay/frontend/assets/icons/Landing Page/Available Documents Section/${icon}" alt=${item.document_name}">
        
            <h3>${item.document_name}</h3>

            <p>${item.description}</p>
        `;

        documentList.appendChild(card);
    });
}

displayDocuments(documents);