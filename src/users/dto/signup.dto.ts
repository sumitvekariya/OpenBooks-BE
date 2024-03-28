export class SignUpDto {
  username: string;
  longitude: string;
  latitude: string;
  name?:  string;
  profilePicture?: string;
}

export class DecodedAuthToken {
  _id: string;
  publicKey: string;
}