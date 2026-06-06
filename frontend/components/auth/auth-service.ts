import { api } from '@/lib/api/client'
import { loginSchema, registerSchema } from '@/lib/validations/schemas'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  organizationName: string
  organizationMode: 'SOLO' | 'FLEET'
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    organizationId: string
    organizationName: string
    organizationMode: string
  }
  accessToken: string
  refreshToken?: string
  message: string
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data as AuthResponse
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data as AuthResponse
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {})
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('role')
      localStorage.removeItem('org_mode')
      localStorage.removeItem('user_profile')
    }
  },

  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }
      
      const response = await api.post('/auth/refresh', { refreshToken })
      return response.data as AuthResponse
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      console.error('Get current user failed:', error)
      throw error
    }
  }
}
