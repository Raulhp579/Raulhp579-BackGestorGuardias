const url = "/api";

// Helper para obtener headers con token
function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getSpecialities() {
    try {
        let response = await fetch(`${url}/speciality`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al importar especialidades:", error);
        throw error;
    }
}
export async function createSpeciality(data) {
    const response = await fetch(`${url}/speciality`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        let msg = "Error al crear la especialidad";
        try { const err = await response.json(); msg = err?.error || msg; } catch (_) {}
        throw new Error(msg);
    }
    return await response.json();
}

export async function updateSpeciality(id, data) {
    try {
        let response = await fetch(`${url}/speciality/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al actualizar especialidad:", error);
        throw error;
    }
}

export async function deleteSpeciality(id) {
    const response = await fetch(`${url}/speciality/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        let msg = "Error al eliminar la especialidad";
        try { const err = await response.json(); msg = err?.error || msg; } catch (_) {}
        throw new Error(msg);
    }
    return await response.json();
}
