import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import axios from "axios";
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

  async mintBooks(signupDto: SignUpDto, authUser: DecodedAuthToken): Promise<User> {
    try {
      // update user profile details first
      const udpateObj = {};
      signupDto?.email ? udpateObj['email'] = signupDto?.email : null;
      signupDto?.name ? udpateObj['name'] = signupDto?.name : null;
      signupDto?.profilePicture ? udpateObj['profilePicture'] = signupDto?.profilePicture : null;

      if (signupDto?.latitude && signupDto?.longitude) {
        udpateObj['location'] = { type: 'Point', coordinates: [signupDto?.longitude, signupDto?.latitude] }
      }
      
      const response = await this.userModel.findByIdAndUpdate(authUser._id, udpateObj, { new: true });

      // mint all books
      const allPromises = [];
      for (let i=0; i<signupDto.books.length; i++){
        // // TODO::  before minting check whether user has already minted book or not
        // const savedBook = await this.bookModel.findOne({ isbn: signupDto.books[i].isbn });
        // if (savedBook) {
        //   const userBook = await this.userBookModel.findOne({ bookId: savedBook._id, userId: authUser._id });
        //   if (!userBook) {
        //     const bookDetails: AddBookDto = {
        //       isbn: signupDto.books[i].isbn,
        //       title: signupDto.books[i].title,
        //       author: signupDto.books[i].author,
        //       description: signupDto.books[i].description,
        //       imageUrl: signupDto.books[i].imageUrl,
        //     }
        //     allPromises.push(await this.mintBook(authUser.publicKey, bookDetails));
        //   } else {
        //     idsToRemove.push(signupDto.books[i].isbn);
        //   }
        // } else {
        const bookDetails: AddBookDto = {
          isbn: signupDto.books[i].isbn,
          title: signupDto.books[i].title,
          author: signupDto.books[i].author,
          description: signupDto.books[i].description,
          imageUrl: signupDto.books[i].imageUrl,
        }
        allPromises.push(await this.mintBook(authUser.publicKey, bookDetails));
        // }
      }

      const promiseResults = await Promise.all(allPromises);

      console.log(promiseResults);

      for (let i=0; i<promiseResults.length; i++) {
        // save books in book schema
        let book = null;
        book = await this.bookModel.findOne({ isbn: signupDto.books[i].isbn });
        if (book) {
          // if user book does not exit then only push
          const userBook = await this.userBookModel.findOne({ bookdId: book._id, userId: authUser._id });
          if (!userBook) {
            await this.bookModel.findOneAndUpdate({ isbn: signupDto.books[i].isbn }, { $push: { nftIds: promiseResults[i].nftId }});
          }
        } else {
          const bookObj = {
            isbn: signupDto.books[i].isbn,
            title: signupDto.books[i].title,
            nftIds: [promiseResults[i].nftId],
            author: signupDto?.books[i]?.author,
            imageUrl: signupDto?.books[i]?.imageUrl,
            description: signupDto?.books[i]?.description,
          }
          book = await new this.bookModel(bookObj).save();
        }

        // insert record  in user book schema
        const userBookExist = await this.userBookModel.findOne({  userId: authUser._id, bookId: book._id });

        if (!userBookExist) {
          // insert new record
          const userBookObj: UserBook = {
            userId: authUser._id,
            is_active: true,
            bookId: book._id,
            nftId: promiseResults[i].nftId,
            transactionId: promiseResults[i].transactionId
          }
          await new this.userBookModel(userBookObj).save();
        } else {
          // set is_active to true
          await this.userBookModel.findOneAndUpdate({  userId: authUser._id, bookId: book._id }, { $set: { is_active: true }});
        }
      }

      const newRes = {
        _id: response._id,
        username: response.username,
        name: response.email
      };

      return response;
    } catch (err) {
      throw err;
    }
  }

  async login(loginDto: LoginDto): Promise<User> {
    try {

      const user = await this.userModel.findOne({ username: loginDto.username });
      if (user) {
        user.publicKey = decryptPassword(user.publicKey);


        // console.log("123 ===> ", decryptPassword(user.privateKey))



        const response = {
            _id: user._id,
            username: user.username,
            longitude: user?.location?.coordinates ? user?.location?.coordinates[0] : 0,
            latitude: user?.location?.coordinates ? user?.location?.coordinates[1] : 0,
            publicKey: user.publicKey,
            email: user?.email,
            name: user?.name,
            token: this.generateToken(user.publicKey, user._id.toString()),
            profilePicture: user?.profilePicture || ""
        }
        return response;
      } else {
        const objToSave = {
          username: loginDto.username,
          location: loginDto?.longitude && loginDto?.latitude ? { type: 'Point', coordinates: [loginDto?.longitude, loginDto?.latitude] } : null,
          name: loginDto?.name || "",
          email: loginDto?.email || "",
          profilePicture: loginDto?.profilePicture || ""
        };
        
        const { publicKey, secretKey } = await this.generateKeyPair();

        objToSave['publicKey'] = publicKey;
        objToSave['privateKey'] = secretKey;
  
        const userObj = new this.userModel(objToSave);
        const user = await userObj.save();;
  
        const response  = {
          _id: user._id,
          username: user.username,
          longitude: user?.location?.coordinates ? user?.location?.coordinates[0] : 0,
          latitude: user?.location?.coordinates ? user?.location?.coordinates[1] : 0,
          publicKey,
          token: this.generateToken(publicKey, user._id.toString()),
          name: user?.name,
          profilePicture: user?.profilePicture
        }
        return response;
      }
    }catch (err) {
      console.log(err);
      throw err;
    }
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
        secretKey: Buffer.from(keypair.secretKey).toString('hex')
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
      const foundBook = await this.bookModel.findOne({ isbn: addBookDto?.isbn });

      const userBookObj = {
        userId: authUser._id,
        is_active: true,
        bookId: ""
      }

      if (foundBook) {
        userBookObj.bookId = foundBook._id.toString();

        // check in userBookmodel
        const assignedBook = await this.userBookModel.findOne({ userId: authUser._id, bookId: foundBook._id });

        if (!assignedBook) {
          // mint book and save in userbook
          const bookDetails: AddBookDto = {
            isbn: addBookDto.isbn,
            title: addBookDto.title,
            author: addBookDto.author,
            description: addBookDto.description,
            imageUrl: addBookDto.imageUrl,
          }

          const mintResult = await this.mintBook(authUser.publicKey, bookDetails)

          userBookObj['nftId'] = mintResult.nftId;
          userBookObj['transactionId'] = mintResult.transactionId;
          await new this.userBookModel(userBookObj).save();
        } else {
          await this.userBookModel.findOneAndUpdate({  userId: authUser._id, bookId: foundBook._id }, { $set: { is_active: true }});
        }
        return foundBook;
      }

      // mint book
      const bookDetails: AddBookDto = {
        isbn: addBookDto.isbn,
        title: addBookDto.title,
        author: addBookDto.author,
        description: addBookDto.description,
        imageUrl: addBookDto.imageUrl,
      }

      const mintResult = await this.mintBook(authUser.publicKey, bookDetails)

      userBookObj['nftId'] = mintResult.nftId;
      userBookObj['transactionId'] = mintResult.transactionId;

      const bookObj = new this.bookModel({
        isbn: addBookDto.isbn,
        title: addBookDto?.title || "",
        author: addBookDto.author || "",
        description: addBookDto.description || "",
        imageUrl: addBookDto.imageUrl || "",
        nftIds: [mintResult.nftId]
      });

      const res = await bookObj.save();

      // save user book model schema
      userBookObj.bookId = res._id.toString();
      // check in userBookmodel
      const [assignedBook] = await this.userBookModel.find({ userId: authUser._id, bookId: res._id, is_active: 1});
      
      if (!assignedBook) {
        await new this.userBookModel(userBookObj).save();
      }
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

  async createProject(body: any) {
    try {
      const options = {
        method: "POST",
        url: process.env.UNDERDOG_URL,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${process.env.UNDERDOG_TOKEN}`,
        },
        data: {
          name: body.name,
          symbol: body.symbol,
          description: body.description,
          image: body.image, // TODO : get better Image already hosted
          semifungible: true,
        },
      };
      
      const result = await axios.request(options);
      return result.data;
    } catch (err) {
      throw err;
    }
  }

  async mintBook(publicKey: string, bookDetails: AddBookDto) {
    try {
      const options = {
        method: "POST",
        url: `${process.env.UNDERDOG_URL}/${process.env.PROJECT_ID}/nfts`,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.UNDERDOG_TOKEN}`,
        },
        data: {
          attributes: {
            isbn: bookDetails.isbn,
            title: bookDetails?.title,
            author: bookDetails?.author,
          },
          receiver: { address: publicKey },
          receiverAddress: publicKey,
          name: bookDetails.title,
          symbol: bookDetails?.symbol || "",
          description: bookDetails?.description || "",
          image: bookDetails?.imageUrl || "",
        }
      };

      const mintResponse = await axios.request(options);
      return mintResponse.data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getBookDetails(isbn: string) {
    try {
      const foundBook = await this.bookModel.findOne({ isbn });

      if(!foundBook) {
        throw new HttpException(
          "Book not found",
          HttpStatus.NOT_FOUND
        );
      }

      const response = {
        isbn: foundBook.isbn,
        title: foundBook.title,
        author: foundBook.author,
        description: foundBook.description,
      }

      const allPromises = [];
      for (let i=0; i<foundBook.nftIds.length; i++){
        allPromises.push(await this.searchNFT(foundBook.nftIds[i]));
      }

      let promiseResults = await Promise.all(allPromises);
      promiseResults = JSON.parse(JSON.stringify(promiseResults));
      for(let i=0; i<promiseResults.length; i++) {
        const userBook = await this.userBookModel.findOne({ nftId: promiseResults[i].nftId });
        const userObj = await this.userModel.findOne({ _id: userBook.userId }, { username: 1, name: 1, profilePicture: 1});
        promiseResults[i]['userData'] = userObj;
      }

      response['users'] = promiseResults;
      console.log(promiseResults);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async searchNFT(nftId: number) {
    try {
      const options = {
        method: "GET",
        url: `${process.env.UNDERDOG_URL}/${process.env.PROJECT_ID}/nfts/${nftId}`,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${process.env.UNDERDOG_TOKEN}`,
        }
      };

      const nftResponse = await axios.request(options);
      return {
        nftId: nftResponse?.data?.id,
        mintAddress: nftResponse?.data?.mintAddress,
        ownerAddress: nftResponse?.data?.ownerAddress
      };

    } catch (err) {
      throw err;
    }
  }

  async importPrivateKey(authUser: DecodedAuthToken) {
    try {
      const user = await this.userModel.findOne({ _id: authUser._id });

      if (!user) {
        throw new HttpException(
          "User not found",
          HttpStatus.NOT_FOUND
        );
      }

      return {
        privateKey: decryptPassword(user.privateKey)
      }
    } catch (err) {
      console.log("Import key errr => ", err);
      throw err;
    }
  }
}
