import { Connection, Document } from "mongoose";
import * as mongoose from "mongoose";

export interface Book{
    isbn: string;
    title: string;
    author: string;
    description?: string;
    imageUrl?: string;
    symbol?: string;
    nftIds?: [number]
}

export const BookSchema = new mongoose.Schema({
  isbn: String,
  title: String,
  author: String,
  description: String,
  imageUrl: String,
  symbol: String,
  nftIds: [Number] // 1, 2, 3
}, {
    timestamps: true
});

export const BookProvider = [
  {
    provide: "BOOK_MODEL",
    useFactory: (connection: Connection) =>
      connection.model("books", BookSchema),
    inject: ["DATABASE_CONNECTION"],
  },
];