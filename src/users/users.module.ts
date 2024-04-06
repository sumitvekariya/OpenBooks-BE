import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { DatabaseModule } from "../config/mongoose.module";
import { UserProviders } from "./schema/users.schema";
import { BookProvider } from "./schema/book.schema";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { UserBookProvider } from "./schema/userBook.schema";

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, ...UserProviders, ...BookProvider, ...UserBookProvider],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'users/mint-books', method: RequestMethod.POST },
        { path: 'users/add-book', method: RequestMethod.POST },
        { path: 'users/remove-book', method: RequestMethod.POST },
        { path: 'users/my-books', method: RequestMethod.GET },
        { path: 'users/export-private-key', method: RequestMethod.GET },
      );
  }
}
