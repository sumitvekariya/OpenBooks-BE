import { Document } from "mongoose";

export interface User {
  readonly _id: string;
  readonly username: string;
  readonly privateKey: number;
  password: string;
}
