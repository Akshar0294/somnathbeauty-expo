export type EventStatus = "OPEN" | "LIVE" | "COMPLETED" | "CLOSED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";
export type RegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type EventRecord = {
  id: string;
  eventName: string;
  shortDescription: string;
  fullDescription: string;
  eventImage: string | null;
  galleryImages: string[];
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  registrationPrice: number;
  maximumCapacity: number;
  availableSlots: number;
  registrationOpen: boolean;
  registrationDeadline: string | null;
  status: EventStatus;
  sponsorName: string | null;
  sponsorLogo: string | null;
  sponsorWebsite: string | null;
  termsAndConditions: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebsiteSettings = {
  siteLogo: string | null;
  heroHeading: string;
  heroDescription: string;
  heroImage: string | null;
  aboutText: string;
  contactNumbers: Array<{ name: string; phone: string }>;
  address: string;
  googleMapsUrl: string;
  footerText: string;
  socialLinks: Record<string, string>;
  defaultRegistrationPrice: number;
};

export type RegistrationForm = {
  visitorName: string;
  phone: string;
  email: string;
  city: string;
  gender: "Female";
  termsAccepted: boolean;
};

export const fallbackSettings: WebsiteSettings = {
  siteLogo: "/LOGO.png",
  heroHeading: "Beauty. Quality. Wholesale.",
  heroDescription: "Explore beauty expos, discover new opportunities, and register for upcoming events with Soft Shine Cosmetic.",
  heroImage: "/Hero Banner.png",
  aboutText: "Soft Shine Cosmetic is a beauty and makeup products wholesale business dedicated to bringing quality beauty products to retailers, salons, makeup artists, beauty professionals, resellers, and businesses.",
  contactNumbers: [
    { name: "Dhruvin Solanki", phone: "+91 63521 63885" },
    { name: "Govind Solanki", phone: "+91 82004 64792" }
  ],
  address: "Satabajar, Subhash Rd, SattaBazar, Veraval, Gujarat 362265",
  googleMapsUrl: "https://maps.app.goo.gl/feEfBZJc71QAEM4e9",
  footerText: "Beauty & Makeup Products Wholesale",
  socialLinks: {},
  defaultRegistrationPrice: 100
};
