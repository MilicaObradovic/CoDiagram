import type {AuthResponse, CollaboratorsResponse, ErrorResponse, UserSearchResult} from '../types/auth';
import type {CreateDiagramData, DiagramResponse} from "../types/diagram.ts";

const API_BASE_URL = 'http://localhost:5001/api';

class AuthApi {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
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
        return this.request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async register(name: string, email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
        return this.request<AuthResponse>('/auth/register', {
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
    async createDiagram(diagramData: CreateDiagramData, token: string): Promise<DiagramResponse> {
        return this.request<DiagramResponse>('/diagrams', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(diagramData),
        });
    }

    async getDiagrams( token: string): Promise<DiagramResponse[]> {
        return this.request<DiagramResponse[]>(`/diagrams`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async getDiagramById(id: string, token: string): Promise<DiagramResponse> {
        return this.request<DiagramResponse>(`/diagrams/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async updateDiagram(id: string, diagramData: Partial<CreateDiagramData>, token: string): Promise<DiagramResponse> {
        return this.request<DiagramResponse>(`/diagrams/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(diagramData),
        });
    }

    async deleteDiagram(id: string, token: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/diagrams/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }
    async searchUsers(query: string, token: string, limit: number = 10): Promise<UserSearchResult[]> {
        return this.request<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async updateDiagramCollaborators(diagramId: string, collaboratorIds: string[], token: string): Promise<DiagramResponse> {
        return this.request<DiagramResponse>(`/diagrams/${diagramId}/collaborators`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ collaborators: collaboratorIds }),
        });
    }

    async getDiagramCollaborators(diagramId: string, token: string): Promise<CollaboratorsResponse> {
        return this.request<CollaboratorsResponse>(`/diagrams/${diagramId}/collaborators`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

}

export const authApi = new AuthApi();