
import { API_BASE_URL } from "../config/apiConfig.js";

export async function getReports(dateFrom = "", dateTo = "") {
    try {
        const params = new URLSearchParams();

        if (dateFrom) {
            params.append("dateFrom", dateFrom);
        }

        if (dateTo) {
            params.append("dateTo", dateTo);
        }

        const queryString = params.toString();

        const response = await fetch(
            `${API_BASE_URL}/reports${queryString ? `?${queryString}` : ""}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to retrieve report data."
            );
        }

        return data.data;

    } catch (error) {
        console.error("Get reports service error:", error);
        throw error;
    }
}
