export const API_BASE = window.location.origin;
export async function request(path, { token, signal, ...options } = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    signal,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an unreadable response. Check the backend URL.",
    );
  }
  if (!response.ok) {
    const err = new Error(data.error?.message || "Request failed.");
    err.status = response.status;
    err.fields = data.error?.fields;
    throw err;
  }
  return data;
}
export function uploadFile(file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/admin/media`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () =>
      reject(new Error("Upload failed. Check your connection and try again."));
    xhr.ontimeout = () =>
      reject(new Error("Upload timed out. Try a smaller file."));
    xhr.onload = () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Unexpected upload response."));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else
        reject(
          Object.assign(new Error(data.error?.message || "Upload failed."), {
            status: xhr.status,
          }),
        );
    };
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}
