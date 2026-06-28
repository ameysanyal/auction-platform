import { IUser } from "./user";

export interface LoginRequest {
  email: string;

  password: string;
}

export interface RegisterRequest {
  name: string;

  email: string;

  password: string;
}

export interface AuthResponse {
  user: IUser;

  accessToken: string;
}