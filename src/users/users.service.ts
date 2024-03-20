import { Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { SignUpDto } from "./dto/signup.dto";
import { User } from "./users.interface";
import { decryptPassword } from "./schema/users.schema";


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

      console.log("this =", singupDto.password);

      const objToSave = {
        username: singupDto.username,
        location: { type: 'Point', coordinates: [singupDto.longitude, singupDto.latitude] },
        password: singupDto.password
      };
  
      const userObj = new this.userModel(objToSave);
      const user = await userObj.save();
      return user;
    } catch (err) {
      throw err;
    }
  }

  async findAll(): Promise<User> {
    const users = await this.userModel.findOne({ username: "jay" });
    users.password = decryptPassword(users.password);
    return users;
  }
}
