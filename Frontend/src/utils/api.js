/**
 * Tiny async API client for the KWI FastAPI backend.
 * BASE_URL points at the FastAPI server (port 8000). Override via VITE_API_URL.
 */
const BASE_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      if (err && err.detail) detail = err.detail;
    } catch {
      /* ignore parse failures */
    }
    throw new Error(detail);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

/**
 * Multipart POST — used for citizen report submissions that include the exact
 * original image file. FormData sets its own Content-Type boundary, so we must
 * NOT set the JSON Content-Type header here.
 */
async function postForm(path, formData, token) {
  const headers = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      if (err && err.detail) detail = err.detail;
    } catch {
      /* ignore parse failures */
    }
    throw new Error(detail);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

export const api = {
  get: (path, token) => request(path, { token }),
  post: (path, body, token) => request(path, { method: "POST", body, token }),
  postForm: (path, formData, token) => postForm(path, formData, token),
  patch: (path, body, token) => request(path, { method: "PATCH", body, token }),
};

export default api;