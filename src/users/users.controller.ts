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

const signupSchema = Joi.object({
  username: Joi.string().required(),
  longitude: Joi.string().required(),
  latitude: Joi.string().required()
});

const loginSchema = Joi.object({
  username: Joi.string().required()
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
}
