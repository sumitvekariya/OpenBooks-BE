import { Connection, Document } from "mongoose";
import * as mongoose from "mongoose";
import * as CryptoJS from "crypto-js";

export interface User{
  username: string;
  privateKey?: string;
  publicKey: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  token?: string;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  profilePicture?: string;
}

export const UserSchema = new mongoose.Schema({
  username: String,
  privateKey: String,
  publicKey: String,
  name: String,
  profilePicture: String,
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number]
    },
  },
},{
  timestamps: true
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
    if (this.publicKey) {
      const encryptedPublickey = encryptKeys(this.publicKey);
      this.publicKey = encryptedPublickey;
    }
    if (this.privateKey) {
      const encryptedPrivateKey = encryptKeys(this.privateKey);
      this.privateKey = encryptedPrivateKey;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const encryptKeys = function(password: string): string {
  const encryptedPassword = CryptoJS.AES.encrypt(password, process.env.ENC_KEY).toString();
  return encryptedPassword;
};

export const decryptPassword = function(password): string {
  const decryptedBytes = CryptoJS.AES.decrypt(password, process.env.ENC_KEY);
  const decryptedPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);
  return decryptedPassword;
};