export function getCurrentUser() {
    const storedUser = localStorage.getItem("currentUser");

    return storedUser ? JSON.parse(storedUser) : null;
}

export function setCurrentUser(user) {
    if (!user || !user.user_id || !user.role) {
        throw new Error("Invalid user information.");
    }

    const currentUser = {
        user_id: user.user_id,
        role: user.role,
        ...(user.email && {
            email: user.email
        }),
        ...(user.resident_id && {
            resident_id: user.resident_id
        }),
        ...(user.staff_id && {
            staff_id: user.staff_id
        })
    };

    const previousUser = getCurrentUser();

    localStorage.setItem(
        "currentUser",
        JSON.stringify(currentUser)
    );

    if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("e-barangay-session");
        channel.postMessage({
            type: "account-changed",
            previousUser,
            currentUser
        });
        channel.close();
    }

    return currentUser;
}

export function logoutUser() {
    localStorage.removeItem("currentUser");
}

export function startSessionAccountMonitor() {
    let monitoredUser = getCurrentUser();
    let dialogVisible = false;

    function showLoggedOutDialog() {
        if (dialogVisible) return;
        dialogVisible = true;

        const dialog = document.createElement("dialog");
        dialog.className = "account-session-dialog";
        dialog.setAttribute("aria-labelledby", "account-session-title");
        dialog.innerHTML = `
            <div class="account-session-content">
                <h2 id="account-session-title">Session ended</h2>
                <p>The account was logged out in another tab on this device.</p>
                <button type="button" class="account-session-button">Return to login</button>
            </div>
        `;

        dialog.addEventListener("close", () => {
            dialogVisible = false;
            dialog.remove();
        });
        dialog.querySelector("button").addEventListener("click", () => {
            dialog.close();
            window.location.replace("../public/login.html");
        });

        document.body.appendChild(dialog);
        dialog.showModal();
    }

    function showAccountChangedDialog(previousUser, currentUser) {
        if (dialogVisible) return;
        dialogVisible = true;

        const previousId = String(previousUser?.user_id || "");
        const currentId = String(currentUser?.user_id || "");
        if (!currentId || previousId === currentId) {
            dialogVisible = false;
            return;
        }

        const dialog = document.createElement("dialog");
        dialog.className = "account-session-dialog";
        dialog.setAttribute("aria-labelledby", "account-session-title");

        const accountLabel = currentUser.email
            ? `Account: ${currentUser.email}`
            : "A different account";

        dialog.innerHTML = `
            <div class="account-session-content">
                <h2 id="account-session-title">Another account is logged in</h2>
                <p>Your previous account session was replaced on this device.</p>
                <p class="account-session-label">${accountLabel}</p>
                <button type="button" class="account-session-button">Continue</button>
            </div>
        `;

        dialog.addEventListener("close", () => {
            dialogVisible = false;
            dialog.remove();
        });
        dialog.querySelector("button").addEventListener("click", () => {
            dialog.close();

            if (currentUser.role === "Staff") {
                window.location.href = "../staff/dashboard.html";
            } else {
                window.location.href = "../resident/overview.html";
            }
        });

        document.body.appendChild(dialog);
        dialog.showModal();
    }

    function handleAccountChange(previousUser, currentUser) {
        monitoredUser = currentUser;
        showAccountChangedDialog(previousUser, currentUser);
    }

    window.addEventListener("storage", event => {
        if (event.key !== "currentUser") return;

        if (!event.newValue) {
            monitoredUser = null;
            showLoggedOutDialog();
            return;
        }

        try {
            const previousUser = monitoredUser || getCurrentUser();
            const currentUser = JSON.parse(event.newValue);
            handleAccountChange(previousUser, currentUser);
        } catch (error) {
            console.error("Unable to process account session change:", error);
        }
    });

    if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("e-barangay-session");
        channel.addEventListener("message", event => {
            if (event.data?.type !== "account-changed") return;

            const previousUser = monitoredUser || event.data.previousUser;
            handleAccountChange(previousUser, event.data.currentUser);
        });
    }
}