class Sidebar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <aside>
                <div class="logo">
                    <img src="../../assets/icons/General Icons/Brgy. Hall Logo (white).png>
                    <div class="logo-name">
                        <h3>E-Barangay</h3>
                        <h4>Barangay Hall Management System</h4>
                    </div>
                </div>
                <div class="profile">
                    <img src="../../assets/images/profile_images/default.png">
                    <h1>Juan B. Dela Cruz</h1>
                    <h2>Balagtas, Batangas</h2>
                </div>
                <nav>
                    <a href="#..."><img src="../../assets/icons/Resident Portal/Navigation Bar/Overview.png">Overview</a>
                    <a href="#..."><img src="../../assets/icons/Resident Portal/Navigation Bar/My Requests.png">My Requests</a>
                    <a href="#..."><img src="../../assets/icons/Resident Portal/Navigation Bar/Document Catalog.png">Document Catalog</a>
                    <a href="#..."><img src="../../assets/icons/Resident Portal/Navigation Bar/Document Request.png">Document Request</a>
                    <a href="#..."><img src="../../assets/icons/Resident Portal/Navigation Bar/Announcements.png">Announcements</a>
                    <a href="#..."><img src="../../assets/icons/Resident Portal/Navigation Bar/Notification (Navbar).png">Notifications</a>
                    <a href="#..."><img src="../../assets/icons/Resident Portal/Navigation Bar/Help Icon (white).png">Help & Support</a>
                    <a href="#..."><img src="../../assets/icons/Resident Portal/Navigation Bar/Settings Icon.png">Settings</a>
                </nav>
            </aside>
        `;
    }
}

customElements.define('app-navbar', Sidebar);