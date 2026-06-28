/*
In TypeScript, an express.d.ts file is a type declaration file used to describe the shape of the Express.js module. 
Its primary uses are to provide autocomplete and type safety, and to allow developers to "extend" or customize the default Express Request and Response objects (e.g., adding a currentUser property from a middleware).
*/

import { IUser } from "../models/user.model.js"; // Import your User Mongoose interface/type

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Or whatever type your user object is
      file?: Express.Multer.File;           // single file
      files?: Express.Multer.File[];
    }
  }
}