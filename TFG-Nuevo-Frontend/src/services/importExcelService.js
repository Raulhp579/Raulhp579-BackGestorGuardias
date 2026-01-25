
//import.users
const API_BASE = "/api";

export async function importWorkersExcel(file) {
    const formData = new FormData();
    formData.append("file", file); // el backend espera 'file'

    const res = await fetch(`${API_BASE}/importUsers`, {
        method: "POST",
        body: formData,
        // NO pongas headers aquí
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

    if (!res.ok) {
        const msg =
            typeof data === "string"
                ? data
                : (data?.error || data?.mistake || data?.message || "Error al importar");
        throw new Error(msg);
    }

    return data;




}

export async function importExcel({ file, year, month, idSpeciality }) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("year", String(year));
        const monthNumber = Number(String(month).replace(/^0+/, "")) || 0; // "01"->1, "10"->10
        formData.append("month", String(monthNumber));
        formData.append("idSpeciality", String(idSpeciality));

        const response = await fetch(`${API_BASE}/importDuties`, {
            method: "POST",
            body: formData,
            // OJO: NO pongas Content-Type aquí. El navegador lo pone con el boundary.

        });

        // intenta leer json aunque haya error (para message)
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const msg = data?.message || `HTTP error! status: ${response.status}`;
            throw new Error(msg);
        }
        return data;
    } catch (error) {
        console.error("Error al importar guardias:", error);
        throw error;
    }

}