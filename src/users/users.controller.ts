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

const signupSchema = Joi.object({
  username: Joi.string().required(),
  longitude: Joi.string().required(),
  latitude: Joi.string().required(),
  password: Joi.string()
});

@Controller("users")
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('signup')
  @UsePipes(new JoiValidationPipe(signupSchema))
  async SignUp(@Body() signupDto: SignUpDto) {
    try {
      const user = await this.userService.signUp(signupDto);
      return user;
    } catch (err) {
      throw new HttpException(
        err.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return {
        data: users,
      };
    } catch (err) {
      throw new HttpException(
        "Internal server error",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
