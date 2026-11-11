import { residents } from "../mock-data/resident.js";
import { staff } from "../mock-data/staff.js";

export function getCurrentUser() {
    const storedUser = localStorage.getItem("currentUser");

    return storedUser ? JSON.parse(storedUser) : null;
}

export function setCurrentUser(user) {
     let currentUser = {
        user_id: user.user_id,
        role: user.role
    };

    if (user.role === "Resident") {

        console.log("Login user:", user);
        console.log("User ID:", user.user_id);

        const residentUser = residents.find(
            resident => resident.user_id === user.user_id
        );

        console.log("Found resident:", residentUser);
        console.log("Resident ID:", residentUser?.resident_id);

        if (!residentUser) {
            throw new Error("Resident profile not found.");
        }

        currentUser.resident_id = residentUser.resident_id;

    } else if (user.role === "Staff") {

        const staffUser = staff.find(
            staffMember => staffMember.user_id === user.user_id
        );

        if (!staffUser) {
            throw new Error("Staff profile not found.");
        }

        currentUser.staff_id = staffUser.staff_id;

    }

    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    return currentUser;
}

export function logoutUser() {
    localStorage.removeItem("currentUser");
}