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
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { SignUpDto } from "./dto/signup.dto";
import * as Joi from "joi";
import { JoiValidationPipe } from "../config/validation.pipe";
import { LoginDto } from "./dto/login.dto";
import { AddBookDto, RemoveBookDto } from "./dto/book.dto";
import { PasspostInfo, Seeds } from "./dto/passport.dto";

const signupSchema = Joi.object({
  username: Joi.string().required(),
  longitude: Joi.string(),
  latitude: Joi.string(),
  name: Joi.string(),
  profilePicture: Joi.string()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  name: Joi.string(),
  profilePicture: Joi.string()
});

const addBookSchema = Joi.object({
  isbn: Joi.string().required(),
  title: Joi.string()
});

const removeBookSchema = Joi.object({
  bookId: Joi.string().required()
});

const passportSchema = Joi.object({
  passportauth: Joi.string().required(),
  identifier: Joi.string().required(),
  namespace: Joi.string().required()
});

@Controller("users")
export class UsersController {
  constructor(private readonly userService: UsersService) { }
  

  @Post('activatePassportInstruction')
  @UsePipes(new JoiValidationPipe(passportSchema))
  async activatePassportInstruction(@Body() info: PasspostInfo): Promise<string> {
    const result = this.userService.activatePassport(info);
    return result;
  }

  @Post('signup')
  @UsePipes(new JoiValidationPipe(signupSchema))
  async SignUp(@Body() signupDto: SignUpDto) {
    try {
      const user = await this.userService.signUp(signupDto);
      return { data: user } ;
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
        "Internal server error",
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
}
