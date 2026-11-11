
import { getCurrentUser } from "../core/session.js";
import { getResidentInfo } from "../services/requestService.js";

async function generateResidentName() {
    const currentUser = getCurrentUser();

    try {
        if (!currentUser || !currentUser.resident_id) {
            return null;
        }

        const residents = await getResidentInfo();

        const residentInfo = residents.find(
            resident => resident.resident_id === currentUser.resident_id
        );

        return residentInfo || null;

    } catch (error) {
        console.error("Error retrieving resident information:", error);
        return null;
    }
}

class Sidebar extends HTMLElement {
    async connectedCallback() {

        const residentInfo = await generateResidentName();

        console.log("Resident information:", residentInfo);

        const residentName = residentInfo
            ? [
                residentInfo.first_name,
                residentInfo.middle_name
                    ? residentInfo.middle_name.charAt(0) + "."
                    : "",
                residentInfo.last_name,
                residentInfo.name_extension
            ].filter(Boolean).join(" ")
            : "Resident";

        this.innerHTML = `
            <aside>
                <div class="logo">
                    <img src="../../assets/icons/General Icons/Brgy. Hall Logo (white).png">
                    <div class="logo-name">
                        <h3>E-Barangay</h3>
                        <h4>Barangay Hall Management System</h4>
                    </div>
                </div>

                <div class="profile">
                    <img src="../../assets/images/profile_images/default.png">
                    <div class="profile-info">
                        <h1>${residentName}</h1>
                        <p>Balagtas, Batangas</p>
                    </div>
                </div>

                <nav>
                    <div class="nav-links">
                        <div class="top-nav">
                            <a href="../resident/overview.html">
                                <img src="../../assets/icons/Resident Portal/Navigation Bar/Overview.png">
                                Overview
                            </a>
                            <a href="../resident/my_request.html">
                                <img src="../../assets/icons/Resident Portal/Navigation Bar/My Requests.png">
                                My Requests
                            </a>
                            <a href="../resident/document_catalog.html">
                                <img src="../../assets/icons/Resident Portal/Navigation Bar/Document Catalog.png">
                                Document Catalog
                            </a>
                            <a href="../resident/document_request.html">
                                <img src="../../assets/icons/Resident Portal/Navigation Bar/Document Request.png">
                                Document Request
                            </a>
                            <a href="../resident/announcement.html">
                                <img src="../../assets/icons/Resident Portal/Navigation Bar/Announcements.png">
                                Announcements
                            </a>
                            <a href="../resident/notification.html">
                                <img src="../../assets/icons/Resident Portal/Navigation Bar/Notification (Navbar).png">
                                Notifications
                            </a>
                        </div>

                        <div class="bottom-nav">
                            <a href="../resident/help.html">
                                <img src="../../assets/icons/Resident Portal/Navigation Bar/Help Icon (white).png">
                                Help & Support
                            </a>
                            <a href="../resident/settings.html">
                                <img src="../../assets/icons/Resident Portal/Navigation Bar/Settings Icon.png">
                                Settings
                            </a>
                        </div>
                    </div>
                </nav>
            </aside>
        `;

        const currentPath = window.location.pathname.split("/").pop();

        const navLinks = this.querySelectorAll(".nav-links a");

        navLinks.forEach(link => {
            const linkPath = link.getAttribute("href").split("/").pop();

            link.classList.toggle("active", linkPath === currentPath);
        });
    }
}

customElements.define("app-navbar", Sidebar);
