async function registerResident(registrationData) {
    try {
        console.log("Data being sent:", registrationData);
        console.log("JSON being sent:", JSON.stringify(registrationData));

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(registrationData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        return data;
    } catch (error) {
        throw error;
    }
}