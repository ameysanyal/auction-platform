import type { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

export interface Schemas {
  body?: ZodObject;
  params?: ZodObject;
  query?: ZodObject;
}

export const validate = (schemas: Schemas) => (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and assign parsed data
    if (schemas.body) {
      const parsedBody = schemas.body.parse(req.body);
      req.body = parsedBody;
    }

    if (schemas.params) {
      const parsedParams = schemas.params.parse(req.params);
      req.params = parsedParams as import('express-serve-static-core').ParamsDictionary;
    }
    if (schemas.query) {
      const parsedQuery = schemas.query.parse(req.query);
      req.query = parsedQuery as import('qs').ParsedQs;
    }
    next();
  } catch (error) {
    next(error); // will be caught by your central errorHandler
  }
};

//the parse method in your validate middleware is coming from Zod.
//parse(data):
//Tries to validate data against the schema.
//If valid → returns the parsed (and possibly transformed) value.
//If invalid → throws a ZodError.

// req.params = parsedParams as import("express-serve-static-core").ParamsDictionary;
// req.query = parsedQuery as import("qs").ParsedQs;
// These type assertions are necessary because req.params and req.query have broader types in Express (ParamsDictionary and ParsedQs respectively) that can't be directly inferred from the parsedParams and parsedQuery which are typed according to your Zod schema.
// This is generally acceptable and often required when you're narrowing down types after validation.