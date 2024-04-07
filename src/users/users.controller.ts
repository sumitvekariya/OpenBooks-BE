import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Body,
  UsePipes,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { SignUpDto } from "./dto/signup.dto";
import * as Joi from "joi";
import { JoiValidationPipe } from "../config/validation.pipe";
import { LoginDto } from "./dto/login.dto";
import { AddBookDto, RemoveBookDto } from "./dto/book.dto";

const bookSchema = Joi.array().items({
  isbn: Joi.string().required(),
  title: Joi.string().required(),
  author: Joi.string().required(),
  description: Joi.string().required(),
  imageUrl: Joi.string()
}).min(1).max(3).required();

const signupSchema = Joi.object({
  longitude: Joi.string(),
  latitude: Joi.string(),
  name: Joi.string(),
  email: Joi.string(),
  profilePicture: Joi.string(),
  books: bookSchema
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  name: Joi.string(),
  profilePicture: Joi.string(),
  email: Joi.string(),
  longitude: Joi.string(),
  latitude: Joi.string()
});

const addBookSchema = Joi.object({
  isbn: Joi.string().required(),
  title: Joi.string(),
  author: Joi.string(),
  description: Joi.string(),
  imageUrl: Joi.string()
});

const removeBookSchema = Joi.object({
  bookId: Joi.string().required()
});

@Controller("users")
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('mint-books')
  @UsePipes(new JoiValidationPipe(signupSchema))
  async SignUp(@Req() req: Request, @Body() signupDto: SignUpDto) {
    try {
      const user = await this.userService.mintBooks(signupDto, req['authUser']);
      return { data: user };
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('login')
  @UsePipes(new JoiValidationPipe(loginSchema))
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.userService.login(loginDto);
      return {
        data: user,
      };
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('add-book')
  @UsePipes(new JoiValidationPipe(addBookSchema))
  async addBook(@Req() req: Request, @Body() addBookDto: AddBookDto) {
    try {
      const book = await this.userService.addBook(addBookDto, req['authUser']);
      return {
        data: book,
      };
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Post('remove-book')
  @UsePipes(new JoiValidationPipe(removeBookSchema))
  async removeBook(@Req() req: Request, @Body() removeBookDto: RemoveBookDto) {
    try {
      await this.userService.removeBook(removeBookDto, req['authUser']);
      return {
        data: [],
        message: "Book removed successfully"
      };
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('my-books')
  async getMyBooks(@Req() req: Request) {
    try {
      const books = await this.userService.getMyBooks(req['authUser']);
      return {
        data: books
      };
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('create-project')
  async createProject(@Req() req: Request, @Body() body: any) {
    try {
      const project = await this.userService.createProject(body);
      return {
        data: project
      };
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('book-details/:isbn')
  async getBookDetails(@Param('isbn') isbn: string) {
    try {
      const response = await this.userService.getBookDetails(isbn);
      return {
        data: response
      };
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('export-private-key')
  async importPrivateKey(@Req() req: Request) {
    try {
      const response = await this.userService.importPrivateKey(req['authUser']);
      return {
        data: response
      };
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
