const API_BASE_URL = "/api";

// Helper para obtener headers con token
function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getWorkers() {
    const response = await fetch(`${API_BASE_URL}/workers`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Error al obtener trabajadores");
    }

    return await response.json();
}

export async function getAdmins() {
    const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Error al obtener administradores");
    }

    return await response.json();
}

export async function assignChiefs(month, year) {
    const response = await fetch(
        `${API_BASE_URL}/assingChiefs?month=${month}&year=${year}`,
        {
            headers: getAuthHeaders(),
        },
    );

    if (!response.ok) {
        throw new Error("Error al obtener administradores");
    }
    return await response.json();
}

export async function updateAdmin(userId, payload) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Error al actualizar el administrador");
    }

    return await response.json();
}

export async function deleteAdmin(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Error al eliminar el administrador");
    }

    return await response.json();
}
