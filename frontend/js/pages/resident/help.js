import { helpConfig } from "../../config/helpConfig.js";

function generateHelpCards() {

    const container = document.getElementById("help-card-container");

    if (!container) return;

    container.innerHTML = Object.values(helpConfig).map(item => {

        const iconPath = new URL(
            `../../../assets/icons/Resident Portal/Help & Support Page/${item.icon}`,
            import.meta.url
        ).href;

        return `
            <a href="#" class="help-card">

                <div class="help-card-header">
                    <div class="help-icon">
                        <img src="${iconPath}" alt="">
                    </div>

                    <h3>${item.title}</h3>
                </div>

                <p class="help-description">
                    ${item.description}
                </p>

                <div class="help-card-action">
                    <strong>${item.action.replace(" →", "")}</strong>
                    <span>→</span>
                </div>

            </a>
        `;

    }).join("");
}

document.addEventListener("DOMContentLoaded", generateHelpCards);

