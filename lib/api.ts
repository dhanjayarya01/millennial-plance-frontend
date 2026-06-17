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

export interface BackendProject {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  manager?: BackendUser | null;
  assignedEmployees?: BackendUser[] | null;
  progressPercentage?: number;
}

export interface BackendTask {
  id: number;
  name: string;
  description: string;
  priority: string;
  status: string;
  deadline: string;
  estimatedHours?: number;
  projectId: number;
  projectName?: string;
  employee?: BackendUser | null;
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
    
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

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

  async getUsers(): Promise<ApiResponse<BackendUser[]>> {
    return this.request<ApiResponse<BackendUser[]>>("/api/users", {
      method: "GET",
    });
  }

  async getProjects(): Promise<ApiResponse<BackendProject[]>> {
    return this.request<ApiResponse<BackendProject[]>>("/api/projects", {
      method: "GET",
    });
  }

  async getProjectById(id: string): Promise<ApiResponse<BackendProject>> {
    return this.request<ApiResponse<BackendProject>>(`/api/projects/${id}`, {
      method: "GET",
    });
  }

  async createProject(data: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    status: string;
    managerId?: number | null;
  }): Promise<ApiResponse<BackendProject>> {
    return this.request<ApiResponse<BackendProject>>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    status: string;
    managerId?: number | null;
  }): Promise<ApiResponse<BackendProject>> {
    return this.request<ApiResponse<BackendProject>>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<string>> {
    return this.request<ApiResponse<string>>(`/api/projects/${id}`, {
      method: "DELETE",
    });
  }

  async getTasks(): Promise<ApiResponse<BackendTask[]>> {
    return this.request<ApiResponse<BackendTask[]>>("/api/tasks", {
      method: "GET",
    });
  }

  async getTaskById(id: string): Promise<ApiResponse<BackendTask>> {
    return this.request<ApiResponse<BackendTask>>(`/api/tasks/${id}`, {
      method: "GET",
    });
  }

  async createTask(projectId: string, data: {
    name: string;
    description: string;
    priority: string;
    status: string;
    deadline: string;
    estimatedHours?: number;
    employeeId?: number | null;
  }): Promise<ApiResponse<BackendTask>> {
    return this.request<ApiResponse<BackendTask>>(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: {
    name: string;
    description: string;
    priority: string;
    status: string;
    deadline: string;
    estimatedHours?: number;
    employeeId?: number | null;
  }): Promise<ApiResponse<BackendTask>> {
    return this.request<ApiResponse<BackendTask>>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateTaskStatus(id: string, status: string): Promise<ApiResponse<BackendTask>> {
    return this.request<ApiResponse<BackendTask>>(`/api/tasks/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse<string>> {
    return this.request<ApiResponse<string>>(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiService();
export default api;
