import type { AuthResponse, ErrorResponse } from '../types/auth';

const API_BASE_URL = 'http://localhost:5001/api';

class AuthApi {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}/auth${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Network error occurred');
        }
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        return this.request<AuthResponse>('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async register(name: string, email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
        return this.request<AuthResponse>('/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, confirmPassword }),
        });
    }

    async getCurrentUser(token: string): Promise<{ user: any }> {
        return this.request<{ user: any }>('/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }
}

export const authApi = new AuthApi();