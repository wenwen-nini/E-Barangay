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
        ...(user.resident_id && {
            resident_id: user.resident_id
        }),
        ...(user.staff_id && {
            staff_id: user.staff_id
        })
    };

    localStorage.setItem(
        "currentUser",
        JSON.stringify(currentUser)
    );

    return currentUser;
}

export function logoutUser() {
    localStorage.removeItem("currentUser");
}