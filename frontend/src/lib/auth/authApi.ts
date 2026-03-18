// Auth API - Frontend API calls to Auth Service
const AUTH_SERVICE_PORT = '3001';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface User {
  _id: string;  // Changed from id to _id to match backend
  id: string;   // Keep for backward compatibility
  email: string;
  name: string | null;
  avatar: string | null;
  bio?: string | null;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PublicUserProfile {
  _id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  recommendationsCount: number;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// Helper: Normalize user object from backend
function normalizeUser(user: Record<string, unknown>): User {
  return {
    _id: (user._id as string) || '',
    id: (user._id as string) || (user.id as string) || '', // Map _id to id for convenience
    email: user.email as string,
    name: user.name as string | null,
    avatar: user.avatar as string | null,
    bio: user.bio as string | null,
    role: user.role as string,
    isActive: user.isActive as boolean,
    lastLogin: user.lastLogin as string | null,
    createdAt: user.createdAt as string,
    updatedAt: user.updatedAt as string,
  };
}

// Helper function for API calls
async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Build URL with XTransformPort query parameter
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `/api${endpoint}${separator}XTransformPort=${AUTH_SERVICE_PORT}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Auth is now handled via HTTP-only cookies only (more secure)
  // No localStorage token needed

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important: include HTTP-only cookies
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

// Auth API Functions
export const authApi = {
  async register(input: RegisterInput): Promise<ApiResponse<AuthResponse>> {
    const response = await authFetch<Record<string, unknown>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    
    if (response.success && response.data) {
      const data = response.data as { user: Record<string, unknown>; token: string };
      return {
        ...response,
        data: {
          user: normalizeUser(data.user),
          token: data.token,
        },
      } as ApiResponse<AuthResponse>;
    }
    return response as ApiResponse<AuthResponse>;
  },

  async login(input: LoginInput): Promise<ApiResponse<AuthResponse>> {
    const response = await authFetch<Record<string, unknown>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    
    if (response.success && response.data) {
      const data = response.data as { user: Record<string, unknown>; token: string };
      return {
        ...response,
        data: {
          user: normalizeUser(data.user),
          token: data.token,
        },
      } as ApiResponse<AuthResponse>;
    }
    return response as ApiResponse<AuthResponse>;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await authFetch<Record<string, unknown>>('/auth/me');
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeUser(response.data as Record<string, unknown>),
      } as ApiResponse<User>;
    }
    return response as ApiResponse<User>;
  },

  async verifyToken(): Promise<ApiResponse<User>> {
    const response = await authFetch<Record<string, unknown>>('/auth/verify');
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeUser(response.data as Record<string, unknown>),
      } as ApiResponse<User>;
    }
    return response as ApiResponse<User>;
  },

  async logout(): Promise<ApiResponse> {
    return authFetch('/auth/logout', {
      method: 'POST',
    });
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    return authFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async getUserById(id: string): Promise<ApiResponse<PublicUserProfile>> {
    return authFetch<PublicUserProfile>(`/auth/user/${id}`);
  },

  async updateProfile(data: {
    name?: string;
    avatar?: string;
    bio?: string;
  }): Promise<ApiResponse<User>> {
    const response = await authFetch<Record<string, unknown>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeUser(response.data as Record<string, unknown>),
      } as ApiResponse<User>;
    }
    return response as ApiResponse<User>;
  },

  async forgotPassword(email: string): Promise<ApiResponse> {
    return authFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return authFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};

export type { User, AuthResponse, RegisterInput, LoginInput, ApiResponse, PublicUserProfile };
