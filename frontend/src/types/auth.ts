export interface LoginFormData {
    email: string;
    password: string;
}

export interface LoginFormErrors {
    email?: string;
    password?: string;
}

export interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterFormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export interface ErrorResponse {
    message: string;
    error?: string;
}
export interface UserSearchResult {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}
export interface CollaboratorsResponse {
    diagram: {
        id: string;
        name: string;
        createdBy: UserSearchResult;
    };
    collaborators: UserSearchResult[];
}
