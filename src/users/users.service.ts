import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { DecodedAuthToken, SignUpDto } from "./dto/signup.dto";
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
import { AddBookDto, RemoveBookDto } from "./dto/book.dto";
import { Book } from "./schema/book.schema";
import { UserBook } from "./schema/userBook.schema";
@Injectable()
export class UsersService {
  constructor(
    @Inject("USER_MODEL")
    private userModel: Model<User>,
    @Inject("BOOK_MODEL")
    private bookModel: Model<Book>,
    @Inject("USER_BOOK_MODEL")
    private userBookModel: Model<UserBook>
  ) {}

  async signUp(signupDto: SignUpDto): Promise<User> {
    try {

      // check user already exists or not
      const existingUser = await this.userModel.findOne({ username: signupDto.username });

      if (existingUser) {
        const response  = {
          _id: existingUser._id,
          username: existingUser.username,
          longitude: existingUser.location.coordinates[0],
          latitude: existingUser.location.coordinates[1],
          publicKey: decryptPassword(existingUser.publicKey),
          token: this.generateToken(existingUser?.publicKey, existingUser._id.toString()),
          name: existingUser?.name,
          profilePicture: existingUser?.profilePicture
        }
        return response;
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
      const user = await userObj.save();;

      const response  = {
        _id: user._id,
        username: user.username,
        longitude: user.location.coordinates[0],
        latitude: user.location.coordinates[1],
        publicKey,
        token: this.generateToken(publicKey, user._id.toString()),
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

    const response = {
        _id: user._id,
        username: user.username,
        longitude: user.location.coordinates[0],
        latitude: user.location.coordinates[1],
        publicKey: user.publicKey,
        token: this.generateToken(user.publicKey, user._id.toString()),
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

  generateToken(publicKey: string, _id: string) {
    return jwt.sign({
      publicKey,
      _id
    }, process.env.JWT_KEY);
  }

  async addBook(addBookDto: AddBookDto, authUser: DecodedAuthToken) {
    try {
      const [foundBook] = await this.bookModel.find({ isbn: addBookDto?.isbn });

      const userBookObj: UserBook = {
        userId: authUser._id,
        is_active: true,
        bookId: ""
      }

      if (foundBook) {
        userBookObj.bookId = foundBook._id.toString();

        // check in userBookmodel
        const [assignedBook] = await this.userBookModel.find({ userId: authUser._id, bookId: foundBook._id, is_active: 1});

        if (!assignedBook) {
          await new this.userBookModel(userBookObj).save();
        }
        return foundBook;
      }

      const bookObj = new this.bookModel({
        isbn: addBookDto.isbn,
        title: addBookDto?.title || ""
      });

      const res = await bookObj.save();

      // save user book model schema
      userBookObj.bookId = res._id.toString();
      // check in userBookmodel
      const [assignedBook] = await this.userBookModel.find({ userId: authUser._id, bookId: res._id, is_active: 1});
      
      if (!assignedBook) {
        await new this.userBookModel(userBookObj).save();
      }
      // TODO:: NFT code is pending
      return res;
    } catch (err) {
      throw err;
    }
  }

  async removeBook(removeBookDto: RemoveBookDto, authUser: DecodedAuthToken) {
    try {
      const assignedBooks = await this.userBookModel.find({ userId: authUser._id, bookId: removeBookDto.bookId, is_active: 1});

      if (assignedBooks?.length == 0) {
        throw new HttpException(
          "First add a book",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      await this.userBookModel.updateOne({ userId: authUser._id, bookId: removeBookDto.bookId }, { $set: { is_active: false }});
      return;
    } catch (err) {
      throw err;
    }
  }

  async getMyBooks(authUser: DecodedAuthToken) {
    try {
      const books = await this.userBookModel.find({ userId: authUser._id, is_active: true}).populate('bookId');
      return books;
    } catch (err) {
      throw err;
    }
  }
}
