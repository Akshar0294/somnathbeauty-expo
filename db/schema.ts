import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventName: text("event_name").notNull(),
  shortDescription: text("short_description").notNull().default(""),
  fullDescription: text("full_description").notNull().default(""),
  eventImage: text("event_image"),
  galleryImages: jsonb("gallery_images").$type<string[]>().notNull().default([]),
  venue: text("venue").notNull().default(""),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default("Gujarat"),
  country: text("country").notNull().default("India"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  registrationPrice: integer("registration_price").notNull().default(100),
  maximumCapacity: integer("maximum_capacity").notNull().default(500),
  availableSlots: integer("available_slots").notNull().default(500),
  registrationOpen: boolean("registration_open").notNull().default(false),
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  status: text("status").$type<"OPEN" | "LIVE" | "COMPLETED" | "CLOSED">().notNull().default("OPEN"),
  sponsorName: text("sponsor_name"),
  sponsorLogo: text("sponsor_logo"),
  sponsorWebsite: text("sponsor_website"),
  termsAndConditions: text("terms_and_conditions").notNull().default("Please carry a valid photo ID to the expo."),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: text("registration_id").notNull().unique(),
    eventId: uuid("event_id").notNull().references(() => events.id),
    visitorName: text("visitor_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    city: text("city").notNull(),
    gender: text("gender").$type<"Female">().notNull().default("Female"),
    paymentStatus: text("payment_status").$type<"PENDING" | "PAID" | "FAILED" | "CANCELLED">().notNull().default("PENDING"),
    registrationStatus: text("registration_status").$type<"PENDING" | "CONFIRMED" | "CANCELLED">().notNull().default("PENDING"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignatureVerified: boolean("razorpay_signature_verified").notNull().default(false),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [unique("registrations_event_phone_unique").on(table.eventId, table.phone)]
);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  registrationId: uuid("registration_id").notNull().references(() => registrations.id),
  eventId: uuid("event_id").notNull().references(() => events.id),
  razorpayOrderId: text("razorpay_order_id").notNull().unique(),
  razorpayPaymentId: text("razorpay_payment_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").$type<"PENDING" | "PAID" | "FAILED" | "CANCELLED">().notNull().default("PENDING"),
  signatureVerified: boolean("signature_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const sponsors = pgTable("sponsors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  website: text("website"),
  enabled: boolean("enabled").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  message: text("message").notNull(),
  status: text("status").$type<"UNREAD" | "READ">().notNull().default("UNREAD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const websiteSettings = pgTable("website_settings", {
  id: integer("id").primaryKey().default(1),
  siteLogo: text("site_logo"),
  heroHeading: text("hero_heading").notNull().default("Beauty. Quality. Wholesale."),
  heroDescription: text("hero_description").notNull().default("Explore beauty expos, discover new opportunities, and register for upcoming events with Soft Shine Cosmetic."),
  heroImage: text("hero_image"),
  aboutText: text("about_text").notNull().default("Soft Shine Cosmetic is a beauty and makeup products wholesale business dedicated to bringing quality beauty products to retailers, salons, makeup artists, beauty professionals, resellers, and businesses."),
  contactNumbers: jsonb("contact_numbers").$type<Array<{ name: string; phone: string }>>().notNull().default([]),
  address: text("address").notNull().default("Satabajar, Subhash Rd, SattaBazar, Veraval, Gujarat 362265"),
  googleMapsUrl: text("google_maps_url").notNull().default("https://maps.app.goo.gl/feEfBZJc71QAEM4e9"),
  footerText: text("footer_text").notNull().default("Beauty & Makeup Products Wholesale"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().notNull().default({}),
  defaultRegistrationPrice: integer("default_registration_price").notNull().default(100),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const schema = { events, registrations, payments, sponsors, contactMessages, websiteSettings };
