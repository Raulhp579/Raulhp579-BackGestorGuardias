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