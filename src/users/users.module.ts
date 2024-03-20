import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { DatabaseModule } from "src/config/mongoose.module";
import { UserProviders } from "./schema/users.schema";

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, ...UserProviders],
})
export class UsersModule {}
