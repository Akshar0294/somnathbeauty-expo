import { z } from "zod";

export const indianPhone = z.string().trim().transform((value) => value.replace(/[\s()-]/g, "")).refine((value) => /^(?:\+91|91)?[6-9]\d{9}$/.test(value), "Enter a valid Indian mobile number.");

export const registrationSchema = z.object({
  eventId: z.string().uuid(),
  visitorName: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: indianPhone,
  email: z.string().trim().email("Enter a valid email address.").max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter your city.").max(80),
  category: z.enum(["Parlour Owner", "Others"]),
  gender: z.literal("Female"),
  termsAccepted: z.literal(true, { message: "Please accept the terms and conditions." })
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000)
});

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form.";
}
