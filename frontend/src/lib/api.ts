const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

type ApiResponse<T = unknown> = { success: boolean; message?: string } & T;

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include", // send httpOnly refresh cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<ApiResponse<T>>;
}

export const api = {
  post: <T = unknown>(path: string, body: unknown, token?: string) =>
    request<T>("POST", path, body, token),

  get: <T = unknown>(path: string, token?: string) =>
    request<T>("GET", path, undefined, token),

  patch: <T = unknown>(path: string, body: unknown, token?: string) =>
    request<T>("PATCH", path, body, token),

  delete: <T = unknown>(path: string, token?: string) =>
    request<T>("DELETE", path, undefined, token),
};

export type VendorSession = {
  id: string;
  name: string;
  email: string;
  ownerName: string;
  slug: string;
};
