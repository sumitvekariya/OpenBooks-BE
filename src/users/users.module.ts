import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { DatabaseModule } from "src/config/mongoose.module";
import { UserProviders } from "./schema/users.schema";
import { BookProvider } from "./schema/book.schema";
import { AuthMiddleware } from "./middlewares/auth.middleware";

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, ...UserProviders, ...BookProvider],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'users/add-book', method: RequestMethod.POST });
  }
}
