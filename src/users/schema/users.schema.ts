import { Connection, Document } from "mongoose";
import * as mongoose from "mongoose";
import * as CryptoJS from "crypto-js";

export interface User{
  username: string;
  password: string;
  privateKey: string;
  location?: {
    type: string;
    coordinates: [number];
  };
}

export const UserSchema = new mongoose.Schema({
  username: String,
  privateKey: String,
  password: String,
  location: {
    type: {
      type: String,
      enum: ["Point"]
    },
    coordinates: {
      type: [Number]
    },
  },
});

export const UserProviders = [
  {
    provide: "USER_MODEL",
    useFactory: (connection: Connection) =>
      connection.model("users", UserSchema),
    inject: ["DATABASE_CONNECTION"],
  },
];

UserSchema.pre('save', function(this: User & Document, next) {  
  try {
    if (this.password) {
      const encryptedPassword = encryptPassword(this.password);
      this.password = encryptedPassword;
      next();
    }
  } catch (error) {
    next(error);
  }
});

const encryptPassword = function(password: string): string {
  const encryptedPassword = CryptoJS.AES.encrypt(password, process.env.ENC_KEY).toString();
  return encryptedPassword;
};

export const decryptPassword = function(password): string {
  const decryptedBytes = CryptoJS.AES.decrypt(password, process.env.ENC_KEY);
  const decryptedPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);
  return decryptedPassword;
};