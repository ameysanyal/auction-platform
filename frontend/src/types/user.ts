export interface IUser {
  _id: string;

  name: string;

  email: string;

  role: "USER" | "ADMIN";

  avatar?: string;

  createdAt: string;

  updatedAt: string;
}