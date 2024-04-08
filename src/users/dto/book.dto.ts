export class AddBookDto {
    isbn: string;
    title?: string;
    author?: string;
    description?: string;
    imageUrl?: string;
    symbol?: string;
}
 
export class RemoveBookDto {
  bookId: string;
}