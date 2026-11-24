
import { getCurrentUser } from "../core/session.js";
import { getCurrentUserProfile } from "../services/profileServices.js";

async function generateResidentName() {
    try {
        const profileData = await getCurrentUserProfile();

        if (
            !profileData.success ||
            !profileData.profile ||
            profileData.profile.role !== "Resident"
        ) {
            return null;
        }

        return profileData.profile;

    } catch (error) {
        console.error("Error retrieving resident information:", error);
        return null;
    }
}

class Sidebar extends HTMLElement {
    async connectedCallback() {
        const sidebarLoaded =
            sessionStorage.getItem("residentSidebarLoaded") === "true";
        const currentUser = getCurrentUser();
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
                    <img src="../../assets/images/profile_images/default.png" alt="">
                    <div class="profile-info">
                        <h1>Resident</h1>
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

        const profile = this.querySelector(".profile");
        profile.classList.toggle("sidebar-profile-loading", !sidebarLoaded);
        if (!sidebarLoaded) {
            sessionStorage.setItem("residentSidebarLoaded", "true");
        }

        const residentInfo = await generateResidentName();

        console.log("Resident information:", residentInfo);

        const residentName = residentInfo
            ? [
                residentInfo.resident_first_name,
                residentInfo.resident_middle_name
                    ? residentInfo.resident_middle_name.charAt(0) + "."
                    : "",
                residentInfo.resident_last_name,
                residentInfo.resident_name_extension
            ].filter(Boolean).join(" ")
            : "Resident";

        this.querySelector(".profile-info h1").textContent = residentName;

        if (residentInfo?.profile_image_path) {
            this.querySelector(".profile img").src =
                `http://127.0.0.1:3000${residentInfo.profile_image_path}`;
        }

        profile.classList.remove("sidebar-profile-loading");

        const currentPath = window.location.pathname.split("/").pop();

        const navLinks = this.querySelectorAll(".nav-links a");

        navLinks.forEach(link => {
            const linkPath = link.getAttribute("href").split("/").pop();

            link.classList.toggle("active", linkPath === currentPath);
        });
    }
}

customElements.define("app-navbar", Sidebar);
