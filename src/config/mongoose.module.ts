import { Module } from "@nestjs/common";
import { databaseProviders } from "./mongoose.config";

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
