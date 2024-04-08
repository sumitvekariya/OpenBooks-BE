import { Connection, Document } from "mongoose";
import * as mongoose from "mongoose";

export interface UserBook{
    userId: string;
    bookId: string;
    location?: {
        type: string;
        coordinates: [number, number];
    };
    is_active: boolean;
    nftId: number,
    transactionId: string
}

export const UserBookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'users'
  },
  bookId: {
    type: mongoose.Types.ObjectId,
    ref: 'books'
  },
  nftId: {
    type: Number
  },
  transactionId: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
  },
  mintAddress: {
    type: String,
    default: ""
  },
  ownerAddress: {
    type: String
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number]
    },
  },
}, {
    timestamps: true
});

export const UserBookProvider = [
  {
    provide: "USER_BOOK_MODEL",
    useFactory: (connection: Connection) =>
      connection.model("userbooks", UserBookSchema),
    inject: ["DATABASE_CONNECTION"],
  },
];