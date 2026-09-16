/**
 * Tiny async API client for the KWI FastAPI backend.
 * BASE_URL points at the FastAPI server (port 8000). Override via VITE_API_URL.
 */
const BASE_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";

export function resolveApiAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  return new URL(path, `${BASE_URL}/`).toString();
}

function formatApiErrorMessage(detail, fallback) {
  if (!detail) return fallback || "Request failed";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        const field = item.loc ? item.loc[item.loc.length - 1] : "";
        const fieldName =
          field && field !== "body"
            ? `${field.charAt(0).toUpperCase() + field.slice(1)}: `
            : "";
        return `${fieldName}${item.msg || "Invalid value"}`;
      })
      .filter(Boolean)
      .join(". ");
  }
  if (typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return String(detail);
}

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
    let parsedData = null;
    try {
      parsedData = await res.json();
      if (parsedData && parsedData.detail) detail = parsedData.detail;
      else if (parsedData && parsedData.message) detail = parsedData.message;
      else if (parsedData) detail = parsedData;
    } catch {
      /* ignore parse failures */
    }
    const err = new Error(formatApiErrorMessage(detail, res.statusText));
    err.status = res.status;
    err.data = parsedData;
    throw err;
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
    throw new Error(formatApiErrorMessage(detail, res.statusText));
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
  resolveAssetUrl: resolveApiAssetUrl,
};

export default api;