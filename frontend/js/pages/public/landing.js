const documentIcons = {
    "Barangay Clearance": "Barangay Clearance (landing page).png",
    "Certificate of Residency": "Certificate of Residency (landing page).png",
    "Certificate of Indigency": "Certificate of Indigency (landing page).png",
    "Barangay Business Clearance": "Barangay Business Clearance (landing page).png",
    "Certificate of Good Moral Character": "Certificate of Good Moral Character (landing page).png",
    "Barangay Certification": "Barangay Certification (landing page).png"
};

const documentList = document.getElementById("document-list");

async function loadDocuments() {
    try {
        const response = await fetch("/api/public/documents");

        if (!response.ok) {
            throw new Error("Failed to load documents.");
        }

        const documents = await response.json();

        documentList.innerHTML = "";

        documents.forEach(document => {
            const card = document.createElement("article");
            card.classList.add("document-card");

            const name = document.createElement("h3");
            name.textContent = document.document_name;

            const description = document.createElement("p");
            description.textContent = document.description;

            const fee = document.createElement("p");
            fee.textContent =
                `₱${Number(document.fee_per_copy).toFixed(2)} / copy`;

            const status = document.createElement("span");
            status.textContent = document.availability;
            status.classList.add(
                "document-status",
                document.availability.toLowerCase()
            );

            card.append(name, description, fee, status);
            documentList.appendChild(card);
        });

    } catch (error) {
        console.error(error);

        documentList.textContent =
            "Unable to load available documents at the moment.";
    }
}

loadDocuments();