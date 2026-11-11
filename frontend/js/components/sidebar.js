class Sidebar extends HTMLElement {
    connectedCallback() {
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
                        <h1>Juan B. Dela Cruz</h1>
                        <p>Balagtas, Batangas</p>
                    </div>
                </div>
                <nav>
                    <div class="nav-links">
                        <div class="top-nav">
                            <a href="../resident/overview.html" class="active"><img src="../../assets/icons/Resident Portal/Navigation Bar/Overview.png">Overview</a>
                            <a href="../resident/my_request.html"><img src="../../assets/icons/Resident Portal/Navigation Bar/My Requests.png">My Requests</a>
                            <a href="../resident/document_catalog.html"><img src="../../assets/icons/Resident Portal/Navigation Bar/Document Catalog.png">Document Catalog</a>
                            <a href="../resident/document_request.html"><img src="../../assets/icons/Resident Portal/Navigation Bar/Document Request.png">Document Request</a>
                            <a href="../resident/announcement.html"><img src="../../assets/icons/Resident Portal/Navigation Bar/Announcements.png">Announcements</a>
                            <a href="../resident/notification.html"><img src="../../assets/icons/Resident Portal/Navigation Bar/Notification (Navbar).png">Notifications</a>
                        </div>
                        <div class="bottom-nav">
                            <a href="../resident/help.html"><img src="../../assets/icons/Resident Portal/Navigation Bar/Help Icon (white).png">Help & Support</a>
                            <a href="../resident/settings.html"><img src="../../assets/icons/Resident Portal/Navigation Bar/Settings Icon.png">Settings</a>
                        </div>
                    </div>
                </nav>
            </aside>
        `;
    }
}

customElements.define('app-navbar', Sidebar);

const navLinks = document.querySelectorAll(".nav-links a");

function setActive(id) {
    navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
}

navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        setActive(link.getAttribute("href").slice(1));
    });
});   