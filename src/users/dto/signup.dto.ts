export class SignUpDto {
  username: string;
  longitude: string;
  latitude: string;
  name?:  string;
  profilePicture?: string;
  email?: string;
  books: [
    {
      isbn: string,
      title: string,
      author: string,
      description?: string,
      imageUrl?: string
    }
  ]
}

export class DecodedAuthToken {
  _id: string;
  publicKey: string;
}