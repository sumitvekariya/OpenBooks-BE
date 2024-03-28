export class AddBookDto {
    isbn: string;
    title?: string;
}
 
export class RemoveBookDto {
  bookId: string;
}