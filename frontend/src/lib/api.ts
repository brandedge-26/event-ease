const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

type ApiResponse<T = unknown> = { success: boolean; message?: string } & T;

let _activeBranchId: string | null = null;

export function setActiveBranch(id: string | null) {
  _activeBranchId = id;
}

export function getActiveBranchId(): string | null {
  return _activeBranchId;
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  timeoutMs = 8_000,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(_activeBranchId ? { "X-Branch-Id": _activeBranchId } : {}),
    },
    credentials: "include", // send httpOnly refresh cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  return res.json() as Promise<ApiResponse<T>>;
}

export const api = {
  post: <T = unknown>(path: string, body: unknown, token?: string, timeoutMs?: number) =>
    request<T>("POST", path, body, token, timeoutMs),

  get: <T = unknown>(path: string, token?: string, timeoutMs?: number) =>
    request<T>("GET", path, undefined, token, timeoutMs),

  patch: <T = unknown>(path: string, body: unknown, token?: string) =>
    request<T>("PATCH", path, body, token),

  delete: <T = unknown>(path: string, token?: string) =>
    request<T>("DELETE", path, undefined, token),
};

export type VendorSession = {
  id:           string;
  name:         string;
  email:        string;
  ownerName:    string;
  slug:         string;
  isVerified:   boolean;
  isBlocked:    boolean;
  businessType: string;
};

export type Branch = {
  id:        string;
  vendorId:  string;
  name:      string;
  city:      string;
  area:      string;
  address:   string;
  isDefault: boolean;
  createdAt: string;
};
