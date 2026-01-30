const endpoint = "/api";

// Helper para obtener headers con token
function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getDuties() {
    try {
        let response = await fetch(`${endpoint}/duties`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al obtener guardias:", error);
        throw error;
    }
}

export async function updateDuty(id, data) {
    try {
        let response = await fetch(`${endpoint}/duties/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al actualizar guardia:", error);
        throw error;
    }
}

export async function deleteDuty(id) {
    try {
        let response = await fetch(`${endpoint}/duties/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al eliminar guardia:", error);
        throw error;
    }
}

// Obtener guardias de un trabajador específico
export async function getWorkerDuties(workerId) {
    try {
        // Obtener todas las guardias y filtrar por worker_id
        const allDuties = await getDuties();
        return allDuties.filter((duty) => duty.id_worker === workerId);
    } catch (error) {
        console.error("Error al obtener guardias del trabajador:", error);
        throw error;
    }
}
