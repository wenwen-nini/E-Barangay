import { getDocumentsWithRequirements } from "../../services/getService.js";

const requirementIconPath = new URL(
    "../../../assets/icons/Resident Portal/Document catalog Page/Requirement Icon.png",
    import.meta.url
).href;

function populateFilter(select, values, formatValue = value => value) {
    select.replaceChildren(new Option("All", ""));

    values.forEach(value => {
        select.add(new Option(formatValue(value), String(value)));
    });
}

async function generateDocumentCard() {
    const container = document.getElementById("documents-container");
    const form = document.querySelector(".filter-group form");
    const searchInput = document.getElementById("search");
    const availabilityFilter = document.getElementById("availability");
    const feeFilter = document.getElementById("fee");
    const resetButton = document.getElementById("reset-filter");

    form.addEventListener("submit", event => event.preventDefault());

    try {
        const documents = await getDocumentsWithRequirements();
        const catalogDocuments = Array.isArray(documents) ? documents : [];
        const availabilities = [...new Set(
            catalogDocuments
                .map(document => document.availability)
                .filter(value => typeof value === "string" && value.trim())
        )].sort((a, b) => a.localeCompare(b));
        const fees = [...new Set(
            catalogDocuments
                .map(document => document.fee_per_copy == null ? NaN : Number(document.fee_per_copy))
                .filter(Number.isFinite)
        )].sort((a, b) => a - b);

        populateFilter(availabilityFilter, availabilities);
        populateFilter(feeFilter, fees, fee => fee === 0 ? "Free" : `₱${fee.toFixed(2)}`);

        const renderDocuments = () => {
            const searchTerm = searchInput.value.trim().toLocaleLowerCase();
            const selectedAvailability = availabilityFilter.value.toLocaleLowerCase();
            const selectedFee = feeFilter.value;

            const filteredDocuments = catalogDocuments.filter(document => {
                const requirementNames = (document.requirements ?? [])
                    .map(requirement => requirement.requirement_name)
                    .join(" ");
                const searchableText = [
                    document.document_name,
                    document.description,
                    requirementNames
                ].filter(Boolean).join(" ").toLocaleLowerCase();
                const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
                const matchesAvailability = !selectedAvailability
                    || document.availability?.toLocaleLowerCase() === selectedAvailability;
                const documentFee = document.fee_per_copy == null
                    ? NaN
                    : Number(document.fee_per_copy);
                const matchesFee = !selectedFee || documentFee === Number(selectedFee);

                return matchesSearch && matchesAvailability && matchesFee;
            });

            if (filteredDocuments.length === 0) {
                container.innerHTML = catalogDocuments.length
                    ? "<p>No documents match your filters.</p>"
                    : "<p>No documents available.</p>";
                return;
            }

            container.innerHTML = filteredDocuments.map(document => {
                const requirementList = document.requirements.length > 0
                    ? document.requirements.map(req => `<strong>${req.requirement_name}</strong>`).join(", ")
                    : "<strong>No requirements available.</strong>";

                return `
                    <div class="document-cards">
                        <div class="document-cards-title">
                            <h3>${document.document_name}</h3>
                            <span class="status-badge status-${document.availability.toLowerCase()}">${document.availability}</span>
                        </div>
                        <p>${document.description ?? "No description available."}</p>
                        <div class="document-card-bottom">
                            <div class="requirement-line">
                                <img src="${requirementIconPath}" alt="">
                                <strong>Requirements: ${requirementList}</strong>
                            </div>
                            <button id="view-details-btn" class="view-details-btn">View Details →</button>
                        </div>
                    </div>
                `;
            }).join("");
        };

        searchInput.addEventListener("input", renderDocuments);
        availabilityFilter.addEventListener("change", renderDocuments);
        feeFilter.addEventListener("change", renderDocuments);
        resetButton.addEventListener("click", event => {
            event.preventDefault();
            searchInput.value = "";
            availabilityFilter.value = "";
            feeFilter.value = "";
            renderDocuments();
        });

        renderDocuments();
    } catch (error) {
        console.error("Error loading documents: ", error);
        container.innerHTML = "<p>Unable to load documents.</p>";
    }
}

generateDocumentCard();