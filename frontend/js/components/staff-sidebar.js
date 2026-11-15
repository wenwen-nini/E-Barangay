import { getCurrentUser } from "../core/session.js";
import { staff } from "../mock-data/staff.js";

class StaffSidebar extends HTMLElement {
    connectedCallback() {
        const currentUser = getCurrentUser();
        const staffInfo = staff.find(
            staffMember => staffMember.staff_id === currentUser?.staff_id
        );

        const staffName = staffInfo
            ? [
                staffInfo.first_name,
                staffInfo.middle_name
                    ? staffInfo.middle_name.charAt(0) + "."
                    : "",
                staffInfo.last_name,
                staffInfo.name_extension
            ].filter(Boolean).join(" ")
            : "Staff";

        const staffPosition = staffInfo?.position || "Barangay Staff";

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
                    <img src="../../assets/images/profile_images/staff.png" alt="">
                    <div class="profile-info">
                        <h1>${staffName}</h1>
                        <p>${staffPosition}</p>
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
    }
}

customElements.define("app-staff-sidebar", StaffSidebar);
