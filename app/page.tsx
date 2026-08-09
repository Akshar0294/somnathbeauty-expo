import { PublicSite } from "@/components/site/public-site";
import { LanguageProvider } from "@/components/site/language";

export default function HomePage() {
  return <LanguageProvider><PublicSite /></LanguageProvider>;
}
