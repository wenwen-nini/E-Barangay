
import { getCurrentUserProfile } from "../services/profileServices.js";

class StaffSidebar extends HTMLElement {
    async connectedCallback() {
        this.innerHTML = `
            <aside>
                <div class="logo">
                    <img src="../../assets/icons/General Icons/Brgy. Hall Logo (white).png" alt="">
                    <div class="logo-name">
                        <h3>E-Barangay</h3>
                        <h4>Barangay Hall Management System</h4>
                    </div>
                </div>

                <div class="profile">
                    <img
                        class="staff-profile-image"
                        src="../../assets/images/profile_images/staff.png"
                        alt="Staff profile"
                    >
                    <div class="profile-info">
                        <h1 class="staff-name">Loading...</h1>
                        <p class="staff-position">Loading...</p>
                    </div>
                </div>

                <nav>
                    <div class="nav-links">
                        <div class="top-nav">
                            <a href="../staff/dashboard.html">
                                <img src="../../assets/icons/Staff Portal/Navigation Bar/Dashboard.png" alt="">
                                Dashboard
                            </a>
                            <a href="../staff/request_management.html">
                                <img src="../../assets/icons/Staff Portal/Navigation Bar/Request Management.png" alt="">
                                Request Management
                            </a>
                            <a href="../staff/document_management.html">
                                <img src="../../assets/icons/Staff Portal/Navigation Bar/Document Management.png" alt="">
                                Document Management
                            </a>
                            <a href="../staff/document_release.html">
                                <img src="../../assets/icons/Staff Portal/Navigation Bar/Document Release.png" alt="">
                                Document Release
                            </a>
                            <a href="../staff/announcement.html">
                                <img src="../../assets/icons/Staff Portal/Navigation Bar/Announcements.png" alt="">
                                Announcements
                            </a>
                            <a href="../staff/reports_analytics.html">
                                <img src="../../assets/icons/Staff Portal/Navigation Bar/Reports & Analytics.png" alt="">
                                Reports &amp; Analytics
                            </a>
                        </div>

                        <div class="bottom-nav">
                            <a href="../staff/help.html">
                                <img src="../../assets/icons/Staff Portal/Navigation Bar/Help Icon (white).png" alt="">
                                Help &amp; Support
                            </a>
                            <a href="../staff/settings.html">
                                <img src="../../assets/icons/Staff Portal/Navigation Bar/Settings Icon.png" alt="">
                                Settings
                            </a>
                        </div>
                    </div>
                </nav>
            </aside>
        `;

        const currentPath = window.location.pathname.split("/").pop();

        this.querySelectorAll(".nav-links a").forEach(link => {
            const linkPath = link.getAttribute("href").split("/").pop();
            link.classList.toggle("active", linkPath === currentPath);
        });

        await this.loadStaffProfile();
    }

    
    async loadStaffProfile() {
        const nameElement = this.querySelector(".staff-name");
        const positionElement = this.querySelector(".staff-position");
        const imageElement = this.querySelector(".staff-profile-image");

        try {
            const data = await getCurrentUserProfile();
            const profile = data.profile;

            const staffName = [
                profile.staff_first_name,
                profile.staff_middle_name
                    ? profile.staff_middle_name.charAt(0) + "."
                    : "",
                profile.staff_last_name,
                profile.staff_name_extension
            ].filter(Boolean).join(" ");

            nameElement.textContent = staffName || "Staff";
            positionElement.textContent = profile.position || "Barangay Staff";

            if (profile.profile_image_path) {
                imageElement.src = `http://127.0.0.1:3000${profile.profile_image_path}`;
            }

            imageElement.onerror = () => {
                imageElement.src = "../../assets/images/profile_images/staff.png";
            };

        } catch (error) {
            console.error("Unable to load staff sidebar profile:", error);

            nameElement.textContent = "Staff";
            positionElement.textContent = "Barangay Staff";
        }
    }
}

customElements.define("app-staff-sidebar", StaffSidebar);
