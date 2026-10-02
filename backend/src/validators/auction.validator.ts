import { z } from "zod";

// Only accept ISO 8601 strings that explicitly carry a timezone offset/designator,
// and further restrict to UTC-only (must end with "Z").
const utcDateTimeSchema = z
  .string()
  .datetime({
    offset: true,
    message: "endTime must be a valid ISO 8601 datetime with timezone",
  })
  .refine((value) => value.endsWith("Z"), {
    message: "endTime must be provided in UTC (must end with 'Z')",
  });

export const createAuctionSchema = {
  body: z.object({
    title: z.string().trim().min(1, "Title is required"),

    description: z.string().trim().min(1, "Description is required"),

    startingPrice: z
      .number()
      .positive("Starting price must be greater than 0"),

    endTime: utcDateTimeSchema,

    images: z
      .array(z.string().url())
      .min(1, "At least one image is required"),
  }),
};
