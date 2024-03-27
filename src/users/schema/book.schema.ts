import { Connection, Document } from "mongoose";
import * as mongoose from "mongoose";

export interface Book{
    isbn: string;
}

export const BookSchema = new mongoose.Schema({
  isbn: String,
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