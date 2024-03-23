import { Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { SignUpDto } from "./dto/signup.dto";
import { decryptPassword, User } from "./schema/users.schema";
import { Keypair, Transaction, PublicKey, Connection, LAMPORTS_PER_SOL, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { activatePassportInstruction } from "@underdog-protocol/passport";


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
      
      await this.generateKeyPair(singupDto.username);

      // objToSave['publicKey'] = publicKey;
      // objToSave['privateKey'] = secretKey;

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

  async generateKeyPair(username: string) {
    try {
      const connection = new Connection(process.env.SOLANA_RPC_URL,"single");

      const payer = Keypair.generate();

      const keypair = Keypair.generate();
      const space = 0;

      const lamports = await connection.getMinimumBalanceForRentExemption(space);
      await connection.requestAirdrop(payer.publicKey, 5000 * LAMPORTS_PER_SOL);
      await connection.requestAirdrop(keypair.publicKey, 3 * LAMPORTS_PER_SOL);

      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: keypair.publicKey,
        lamports,
        space,
        programId: SystemProgram.programId,
      });
      
      let recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash);

      const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash,
        instructions: [createAccountIx],
      }).compileToV0Message();
    
      const tx = new VersionedTransaction(message);
    
      tx.sign([payer, keypair]);
    
      console.log("tx after signing:", tx);
    
      const sig = await connection.sendTransaction(tx);
      console.log("Final ==> ", explorerURL({ txSignature: sig }));
    } catch (err) {
      console.log("error => ", err);
      throw err;
    }
  }

  // async generateKeyPair(username: string): Promise<{
  //   publicKey: String,
  //   secretKey: String
  // }> {
  //   try {
  //     const seeds = {
  //       identifier: username,
  //     };
      
  //     const passportAuthority = Keypair.generate();
  
  //     const instruction = activatePassportInstruction(
  //       seeds,
  //       new PublicKey(process.env.DOMAIN_PUBLIC_KEY),
  //       passportAuthority.publicKey
  //     );
  
  //     const transObj = new Transaction();
  //     const savedTranscation = await transObj.add(instruction);

  //     console.log("savedTranscation ==> ", savedTranscation);
  
  //     console.log("passport original pub key =? ", passportAuthority.publicKey);
  //     console.log("Domain Public key ==> ", new PublicKey(process.env.DOMAIN_PUBLIC_KEY));
  //     // console.log("original sec key =? ", passportAuthority.secretKey);
  
  //     // console.log("Private key ==> ", Buffer.from(passportAuthority.secretKey).toString('base64'));

  //     // const domainseeds = {
  //     //   identifier: "openbooks-dev",
  //     // };
  //     // const instruction1 = activatePassportInstruction(
  //     //   domainseeds,
  //     //   new PublicKey(process.env.DOMAIN_PUBLIC_KEY),
  //     //   passportAuthority.publicKey
  //     // );
  
  //     // const transObj1 = new Transaction();
  //     // const savedTranscation1 = await transObj.add(instruction);


  //     return {
  //       publicKey:  passportAuthority.publicKey.toBase58(),
  //       secretKey:  Buffer.from(passportAuthority.secretKey).toString('base64')
  //     }
  //   } catch (err) {
  //     console.log("error => ", err);
  //     throw err;
  //   }
  // }
}
function explorerURL(arg0: { txSignature: string; }): any {
  throw new Error("Function not implemented.");
}

