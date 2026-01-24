const endpoint = "/api";



export async function getDuties() {
    try {
        let response = await fetch(`${endpoint}/duties`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Accept": "application/json",
            },

        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}
