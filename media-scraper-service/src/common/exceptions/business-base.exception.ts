import { HttpException, HttpStatus } from "@nestjs/common";

// Business exception base class
export class BusinessBaseException extends HttpException {
  constructor(message: string, code: number = HttpStatus.BAD_REQUEST) {
    super(message, code);
  }
}