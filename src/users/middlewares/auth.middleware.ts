import { HttpException, HttpStatus, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // decoding jwt token
    if (!req.headers.authorization) {
      throw new HttpException(
        'UNAUTHORIZED',
        HttpStatus.UNAUTHORIZED
      );
    }

    const decoded = jwt.verify(req.headers.authorization, process.env.JWT_KEY);

    if (!decoded.publicKey && !decoded.publicKey) {
      throw new HttpException(
        'UNAUTHORIZED',
        HttpStatus.UNAUTHORIZED
      );
    };
    
    next();
  }
}