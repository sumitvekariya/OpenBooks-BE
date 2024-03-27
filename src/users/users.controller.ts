import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Body,
  UsePipes,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { SignUpDto } from "./dto/signup.dto";
import * as Joi from "joi";
import { JoiValidationPipe } from "../config/validation.pipe";
import { LoginDto } from "./dto/login.dto";
import { AddBookDto } from "./dto/book.dto";

const signupSchema = Joi.object({
  username: Joi.string().required(),
  longitude: Joi.string().required(),
  latitude: Joi.string().required(),
  name: Joi.string(),
  profilePicture: Joi.string()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  name: Joi.string(),
  profilePicture: Joi.string()
});

const addBookSchema = Joi.object({
  isbn: Joi.string().required()
});

@Controller("users")
export class UsersController {
  constructor(private readonly userService: UsersService) {}

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
  async addBook(@Body() addBookDto: AddBookDto) {
    try {
      const book = await this.userService.addBook(addBookDto);
      return {
        data: book,
      };
    } catch (err) {
      throw new HttpException(
        "Internal server error",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
}
