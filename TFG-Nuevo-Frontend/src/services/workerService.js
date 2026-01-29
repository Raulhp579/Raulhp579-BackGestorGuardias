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

export async function deleteWorker(workerId) {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Error al eliminar el trabajador");
    }

    return await response.json();
}

export async function updateWorker(workerId, payload) {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Error al actualizar el trabajador");
    }

    return await response.json();
}
