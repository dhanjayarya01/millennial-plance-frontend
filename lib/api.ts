// API Client Service for connecting frontend to the Spring Boot backend

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface BackendUser {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
  active: boolean;
  verified: boolean;
  profilePictureUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: BackendUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    // Set headers
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Attach auth token if present
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pms-auth-token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type");
    let responseData: any;
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMessage = responseData && typeof responseData === "object" && responseData.message
        ? responseData.message
        : `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData as T;
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<ApiResponse<AuthResponse>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    role: string;
  }): Promise<ApiResponse<BackendUser>> {
    return this.request<ApiResponse<BackendUser>>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
export default api;
