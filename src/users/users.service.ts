import { Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { SignUpDto } from "./dto/signup.dto";
import { decryptPassword, User } from "./schema/users.schema";
import { Keypair, Transaction, PublicKey } from "@solana/web3.js";
// import { activatePassportInstruction } from "@underdog-protocol/passport";


@Injectable()
export class UsersService {
  constructor(
    @Inject("USER_MODEL")
    private userModel: Model<User>
  ) {}

  async signUp(singupDto: SignUpDto): Promise<User> {
    try {

      // check user already exists or not
      const existingUser = await this.userModel.findOne({ username: singupDto.username });

      if (existingUser) {
        return existingUser;
      }

      const objToSave = {
        username: singupDto.username,
        location: { type: 'Point', coordinates: [singupDto.longitude, singupDto.latitude] }
      };
      
      const { publicKey, secretKey } = await this.generateKeyPair(singupDto.username);

      objToSave['publicKey'] = publicKey;
      objToSave['privateKey'] = secretKey;

      const userObj = new this.userModel(objToSave);
      const user = await userObj.save();
      return user;
    } catch (err) {
      throw err;
    }
  }

  async findAll(): Promise<any> {
    const users = await this.userModel.findOne({ username: "jay" });
    users.publicKey = decryptPassword(users.publicKey);
    users.privateKey = decryptPassword(users.privateKey);
    return users;
  }

  async generateKeyPair(username: string): Promise<{
    publicKey: String,
    secretKey: String
  }> {
    // const seeds = {
    //   identifier: username,
    // };
    
    const passportAuthority = Keypair.generate();

    console.log("original pub key =? ", passportAuthority.publicKey);
    console.log("original sec key =? ", passportAuthority.secretKey);

    console.log("Public key ==> ", passportAuthority.publicKey.toBase58());
    console.log("Private key ==> ", Buffer.from(passportAuthority.secretKey).toString('base64'));
    return {
      publicKey:  passportAuthority.publicKey.toBase58(),
      secretKey:  Buffer.from(passportAuthority.secretKey).toString('base64')
    }
  }
}
