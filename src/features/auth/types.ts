export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginError {
  code: string;
  message: string;
}

export interface LoginState {
  isLoading: boolean;
  email: string;
  password: string;
  error: string | null;
}
