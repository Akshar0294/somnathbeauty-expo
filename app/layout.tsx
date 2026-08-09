import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_Gujarati, Playfair_Display } from "next/font/google";
import { QueryProvider } from "@/components/site/query-provider";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const displayFont = Playfair_Display({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = DM_Sans({
  variable: "--font-sans-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const gujaratiFont = Noto_Sans_Gujarati({
  variable: "--font-gujarati",
  subsets: ["gujarati"],
  weight: ["400", "500", "600", "700"],
});

const siteTitle = "Soft Shine Cosmetic | Beauty. Quality. Wholesale.";
const siteDescription = "Beauty and makeup products wholesale with curated women-focused beauty expos in Gujarat.";
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: siteTitle,
  description: siteDescription,
  applicationName: "Soft Shine Cosmetic",
  keywords: ["beauty products wholesale", "makeup products wholesale", "Somnath Beauty Expo", "beauty expo Gujarat", "cosmetics wholesale Veraval"],
  authors: [{ name: "Soft Shine Cosmetic" }],
  creator: "Soft Shine Cosmetic",
  publisher: "Soft Shine Cosmetic",
  category: "business",
  alternates: { canonical: "/" },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Soft Shine Cosmetic",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/Hero Banner.png", width: 1706, height: 922, alt: "Soft Shine Cosmetic beauty expo banner" }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/Hero Banner.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  icons: { icon: "/favicon.svg" }
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Soft Shine Cosmetic",
      url: siteUrl.toString(),
      logo: new URL("/LOGO.png", siteUrl).toString(),
      description: siteDescription
    },
    {
      "@type": "WebSite",
      name: "Soft Shine Cosmetic",
      url: siteUrl.toString(),
      description: siteDescription,
      publisher: { "@type": "Organization", name: "Soft Shine Cosmetic" }
    }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${gujaratiFont.variable}`}>
      <body className={bodyFont.className}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
