// Auth service - JWT-based authentication
// Replace with actual API calls to your backend

const AUTH_TOKEN_KEY = "ngo_admin_token";
const AUTH_USER_KEY = "ngo_admin_user";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Content Manager" | "Finance Admin";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Mock login — replace with: fetch(`${BASE_URL}/auth/login`, { method: 'POST', body: JSON.stringify(creds) })
export async function loginAdmin(creds: LoginCredentials): Promise<{ token: string; user: AdminUser }> {
  await new Promise((r) => setTimeout(r, 500));
  if (creds.email === "admin@ngo.org" && creds.password === "admin123") {
    const token = "mock_jwt_" + Date.now();
    const user: AdminUser = { id: "1", name: "Admin User", email: "admin@ngo.org", role: "Super Admin" };
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return { token, user };
  }
  throw new Error("Invalid email or password");
}

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getUser(): AdminUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
