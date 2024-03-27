import { Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { SignUpDto } from "./dto/signup.dto";
import { decryptPassword, User } from "./schema/users.schema";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
// import { activatePassportInstruction, getPassportAddress } from "@underdog-protocol/passport";

import * as jwt from 'jsonwebtoken';
import { LoginDto } from "./dto/login.dto";
import { AddBookDto } from "./dto/book.dto";
import { Book } from "./schema/book.schema";
@Injectable()
export class UsersService {
  constructor(
    @Inject("USER_MODEL")
    private userModel: Model<User>,
    @Inject("BOOK_MODEL")
    private bookModel: Model<Book>
  ) {}

  async signUp(signupDto: SignUpDto): Promise<User> {
    try {

      // check user already exists or not
      const existingUser = await this.userModel.findOne({ username: signupDto.username });

      if (existingUser) {
        return existingUser;
      }

      const objToSave = {
        username: signupDto.username,
        location: { type: 'Point', coordinates: [signupDto.longitude, signupDto.latitude] },
        name: signupDto?.name || "",
        profilePicture: signupDto?.profilePicture || ""
      };
      
      const { publicKey, secretKey } = await this.generateKeyPair();

      objToSave['publicKey'] = publicKey;
      objToSave['privateKey'] = secretKey;

      const userObj = new this.userModel(objToSave);
      const user = await userObj.save();
      delete userObj.privateKey;

      const response  = {
        _id: user._id,
        username: user.username,
        longitude: user.location.coordinates[0],
        latitude: user.location.coordinates[1],
        publicKey,
        token: this.generateToken(publicKey, user.username, user._id.toString()),
        name: user?.name,
        profilePicture: user?.profilePicture
      }
      return response;
    } catch (err) {
      throw err;
    }
  }

  async login(loginDto: LoginDto): Promise<User> {
    const user = await this.userModel.findOne({ username: loginDto.username });
    user.publicKey = decryptPassword(user.publicKey);
    delete user.privateKey;
    user.token = this.generateToken(user.publicKey, user.username, user._id.toString())

    const response = {
        _id: user._id,
        username: user.username,
        longitude: user.location.coordinates[0],
        latitude: user.location.coordinates[1],
        publicKey: decryptPassword(user.publicKey),
        token: this.generateToken(user.publicKey, user.username, user._id.toString())
    }
    return response;
  }

  async generateKeyPair(): Promise<{
    publicKey: string,
    secretKey: string
  }> {
    try {
      const secretKeyBytes = Uint8Array.from(Buffer.from(process.env.DOMAIN_SECRET_KEY, "base64"));
      const payer = Keypair.fromSecretKey(secretKeyBytes);

      const keypair = Keypair.generate();

      let connection = new Connection(
        process.env.SOLANA_RPC_URL,
        "confirmed",
      );

      const space = 0;
      const balance = await connection.getBalance(payer.publicKey);

      if (balance <= 1000000 && process.env.NODE_ENV === "dev") {
        let airdropSignature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
        
        const latestBlockHash = await connection.getLatestBlockhash();
        
        await connection.confirmTransaction({ signature: airdropSignature, blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight });
        const balance = await connection.getBalance(payer.publicKey);
      }

      const lamports = await connection.getMinimumBalanceForRentExemption(space);

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
  
      // console.log("tx after signing:", tx);
      const sig = await connection.sendTransaction(tx);
      // console.log("Transaction completed.", sig);
      
      return {
        publicKey: keypair.publicKey.toBase58(),
        secretKey: Buffer.from(keypair.secretKey).toString('base64')
      }
    } catch (err) {
      console.log("error => ", err);
      throw err;
    }
  }

  generateToken(publicKey: string, username: string, _id: string) {
    return jwt.sign({
      username,
      publicKey,
      _id
    }, process.env.JWT_KEY);
  }

  async addBook(addBookDto: AddBookDto) {
    try {
      const [foundBook] = await this.bookModel.find({ isbn: addBookDto?.isbn });

      if (foundBook) {
        return foundBook;
      }

      const bookObj = new this.bookModel({
        isbn: addBookDto.isbn
      });

      const res = await bookObj.save();

      // TODO:: NFT code is pending
      return res;
    } catch (err) {
      throw err;
    }
  }
}
