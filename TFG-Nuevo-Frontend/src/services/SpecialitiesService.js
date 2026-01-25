const url = "/api";



export async function getSpecialities() {
    try {
        let response = await fetch(`${url}/specialities`, {
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
        console.error("Error al importar especialidades:", error);
        throw error;
    }
}
