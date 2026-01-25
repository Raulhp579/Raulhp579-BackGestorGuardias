const url = "/api";

export async function importExcel({ file, year, month, idSpeciality }) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("year", String(year));
        formData.append("month", Number(month));
        formData.append("idSpeciality", String(idSpeciality));

        const response = await fetch(`${url}/importDuties`, {
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