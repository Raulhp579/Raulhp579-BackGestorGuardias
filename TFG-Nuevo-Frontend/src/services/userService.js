const API_BASE_URL = "/api";


export async function getWorkers() {
    const response = await fetch(`${API_BASE_URL}/workers`);

    if (!response.ok) {
        throw new Error("Error al obtener trabajadores");
    }

    return await response.json();
}

export async function getAdmins() {
    const response = await fetch(`${API_BASE_URL}/users`);

    if (!response.ok) {
        throw new Error("Error al obtener administradores");
    }

    return await response.json();
}

