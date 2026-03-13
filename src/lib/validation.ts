import { z } from "zod";

export const submitSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  twitter: z.string().max(500).optional().default(""),
  linkedin: z.string().max(500).optional().default(""),
  website: z.string().max(500).optional().default(""),
  description: z.string().max(5000).optional().default(""),
}).refine(
  (data) => data.twitter || data.linkedin || data.website || data.description,
  { message: "At least one field besides name is required" }
);

export const judgeSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().max(80).optional().default(""),
  userId: z.string().optional(),
  name: z.string().min(1, "Name is required").max(200),
  twitter: z.string().max(500).optional().default(""),
  linkedin: z.string().max(500).optional().default(""),
  website: z.string().max(500).optional().default(""),
  description: z.string().max(5000).optional().default(""),
});
