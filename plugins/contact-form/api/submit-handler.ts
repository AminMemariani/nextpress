/**
 * Form submission handler — validates and processes form data.
 * This is called by the plugin's registered API route.
 */

import { z } from "zod";

export const submissionSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

export type FormSubmission = z.infer<typeof submissionSchema>;

export function validateSubmission(data: unknown): FormSubmission {
  return submissionSchema.parse(data);
}
