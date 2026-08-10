"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandedFallback, BeautyStillLife } from "@/components/site/beauty-still-life";
import { Icon } from "@/components/site/icons";
import { useLanguage, type Language, type TranslationKey } from "@/components/site/language";
import { SiteLogo } from "@/components/site/site-logo";
import { formatDigits, formatEventDate, formatEventTime, formatINR, formatNumber, gujaratiLocale, type SiteLocale } from "@/lib/format";
import { firstZodError, registrationSchema } from "@/lib/validation";
import type { EventRecord, RegistrationForm, WebsiteSettings } from "@/types/domain";
import { fallbackSettings } from "@/types/domain";

type View = "HOME" | "EXHIBITIONS" | "EVENT_DETAILS" | "REGISTRATION" | "PAYMENT" | "PAYMENT_SUCCESS" | "PAYMENT_CANCELLED" | "PAYMENT_FAILED";
type PaymentOrder = { registrationId: string; registrationReference: string; orderId: string; amount: number; currency: string; keyId: string };
type SuccessReceipt = { ticketId: string; registrationId: string; eventName: string; visitorName: string; amount: number; paymentId: string; venue: string; startDate: string; endDate: string };

const initialForm: RegistrationForm = { visitorName: "", phone: "", email: "", city: "", category: "Others", gender: "Female", termsAccepted: false };

const knownGujaratiCopy: Record<string, TranslationKey> = {
  "Somnath Beauty Expo": "somnathBeautyExpo",
  "Beauty, cosmetics and professional makeup discoveries for the women shaping the industry.": "eventShortDescription",
  "A focused beauty and cosmetics expo for retailers, salons, makeup artists, resellers and beauty professionals.": "eventFullDescription",
  "These expos are exclusively for female visitors. Please carry a valid photo ID.": "eventTerms",
  "Kapishwar Partyplot, Veraval": "kapishwarPartyplot",
  "Veraval, Gujarat": "veravalGujarat",
  Veraval: "veraval",
  Gujarat: "gujarat",
  India: "india",
  "Dhruvin Solanki": "dhruvinSolanki",
  "Govind Solanki": "govindSolanki"
};

// ponytail: maps the current seeded copy only; add localized database fields when admins need arbitrary Gujarati events.
function localizeKnownCopy(value: string, language: Language, t: (key: TranslationKey) => string) {
  if (language === "en") return value;
  const key = knownGujaratiCopy[value];
  return key ? t(key) : value;
}

function getSiteLocale(language: Language) {
  return language === "gu" ? gujaratiLocale : "en-IN";
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function EventVisual({ event, detail = false }: { event: EventRecord; detail?: boolean }) {
  const { language, t } = useLanguage();
  const [failed, setFailed] = useState(false);
  if (!event.eventImage || failed) return <BrandedFallback />;
  return <img className={detail ? "h-full w-full object-cover" : "h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"} src={event.eventImage} alt={localizeKnownCopy(event.eventName, language, t)} loading={detail ? "eager" : "lazy"} onError={() => setFailed(true)} />;
}

function EventCard({ event, onRegister }: { event: EventRecord; onRegister: (event: EventRecord) => void }) {
  const { language, t } = useLanguage();
  const locale = getSiteLocale(language);
  const eventName = localizeKnownCopy(event.eventName, language, t);
  const shortDescription = localizeKnownCopy(event.shortDescription, language, t);
  const city = localizeKnownCopy(event.city, language, t);
  const state = localizeKnownCopy(event.state, language, t);
  return (
    <article className="group overflow-hidden rounded-[14px] border border-line bg-white transition duration-200 hover:border-rose/60">
      <div className="relative aspect-[16/9] overflow-hidden bg-[#f5f1ef]">
        <EventVisual event={event} />
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[.64rem] font-extrabold uppercase tracking-[.09em] text-success">
          <span className="size-1.5 rounded-full bg-current" /> {event.status === "LIVE" ? t("liveNow") : t("open")}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-display text-[1.45rem] leading-[1.05] tracking-[-.025em]">{eventName}</h3>
        <p className="mt-2 min-h-12 text-[.9rem] leading-6 text-muted">{shortDescription}</p>
        <div className="mt-4 grid gap-2.5 border-t border-line pt-4 text-xs leading-5 text-muted">
          <div className="flex items-start gap-2.5"><Icon name="location" size={17} className="shrink-0 text-rose" /><span>{city}, {state}</span></div>
          <div className="flex items-start gap-2.5"><Icon name="calendar" size={17} className="shrink-0 text-rose" /><span>{formatEventDate(event.startDate, event.endDate, locale)}</span></div>
        </div>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div><span className="mb-0.5 block text-[.65rem] uppercase tracking-[.08em] text-muted">{t("registrationFee")}</span><strong className="text-[1.34rem]">{formatINR(event.registrationPrice, locale)}</strong></div>
          <span className="text-right text-xs font-bold text-success">{formatNumber(event.availableSlots, locale)} {t("slotsLeft")}</span>
        </div>
        <button type="button" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white transition hover:bg-slate-700" onClick={() => onRegister(event)}>{t("register")} <Icon name="arrow" size={17} /></button>
      </div>
    </article>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const { t } = useLanguage();
  return <label className="grid gap-1.5 text-xs font-bold text-slate-700">{label}{required && <span className="sr-only"> {t("required")}</span>}{children}</label>;
}

export function PublicSite() {
  const { language, setLanguage, t } = useLanguage();
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: () => getJson<WebsiteSettings>("/api/site-settings") });
  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: () => getJson<EventRecord[]>("/api/events") });
  const settings = settingsQuery.data ?? fallbackSettings;
  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const locale = getSiteLocale(language);
  const aboutText = language === "gu" && settings.aboutText === fallbackSettings.aboutText ? t("aboutBody") : settings.aboutText;
  const footerText = language === "gu" && settings.footerText === fallbackSettings.footerText ? t("footerDescription") : settings.footerText;

  const [mobileMenu, setMobileMenu] = useState(false);
  const [view, setView] = useState<View>("HOME");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [flowError, setFlowError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<SuccessReceipt | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactState, setContactState] = useState<{ loading: boolean; message: string; error: string }>({ loading: false, message: "", error: "" });
  const paymentHandled = useRef(false);

  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) ?? null, [events, selectedEventId]);

  useEffect(() => {
    if (!window.history.state?.softShineFlow) window.history.replaceState({ softShineFlow: true, view: "HOME" }, "", window.location.pathname);
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      setView(state?.softShineFlow ? (state.view as View) : "HOME");
      setSelectedEventId(state?.softShineFlow ? state.eventId ?? null : null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (view === "HOME") return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setView("HOME");
      setSelectedEventId(null);
      setPaymentOrder(null);
      window.history.replaceState({ softShineFlow: true, view: "HOME" }, "", window.location.pathname);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [view]);

  function pushView(next: View, eventId = selectedEventId) {
    setView(next);
    setSelectedEventId(eventId ?? null);
    window.history.pushState({ softShineFlow: true, view: next, eventId: eventId ?? null }, "", window.location.pathname + "#" + next.toLowerCase());
  }

  function replaceView(next: View, eventId = selectedEventId) {
    setView(next);
    setSelectedEventId(eventId ?? null);
    window.history.replaceState({ softShineFlow: true, view: next, eventId: eventId ?? null }, "", window.location.pathname + "#" + next.toLowerCase());
  }

  function goHome() {
    setView("HOME");
    setSelectedEventId(null);
    setPaymentOrder(null);
    window.history.replaceState({ softShineFlow: true, view: "HOME" }, "", window.location.pathname);
  }

  function navTo(id: string) {
    setMobileMenu(false);
    if (view !== "HOME") goHome();
    window.setTimeout(() => scrollToSection(id), 0);
  }

  function registerForEvent(event: EventRecord) {
    setForm(initialForm);
    setFlowError("");
    setPaymentOrder(null);
    setSuccessReceipt(null);
    pushView("REGISTRATION", event.id);
  }

  function openRegistration() {
    setFlowError("");
    setPaymentOrder(null);
    setSuccessReceipt(null);
    pushView("REGISTRATION");
  }

  function backFromFlow() {
    if (view === "EVENT_DETAILS") {
      goHome();
      window.setTimeout(() => scrollToSection("exhibitions"), 0);
      return;
    }
    if (view === "REGISTRATION") { replaceView("EVENT_DETAILS"); return; }
    if (view === "PAYMENT") { replaceView("REGISTRATION"); return; }
    if (view === "PAYMENT_CANCELLED" || view === "PAYMENT_FAILED") { replaceView("EVENT_DETAILS"); return; }
    goHome();
  }

  async function markPayment(status: "FAILED" | "CANCELLED", registrationId: string) {
    try {
      await fetch("/api/registrations/fail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId, status }) });
    } catch {
      // The pending registration remains non-confirmed if the browser goes offline.
    }
  }

  async function loadRazorpay() {
    if (window.Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.getElementById("razorpay-checkout");
      if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("Payment checkout could not load.")), { once: true }); return; }
      const script = document.createElement("script");
      script.id = "razorpay-checkout";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Payment checkout could not load."));
      document.body.appendChild(script);
    });
  }

  async function openCheckout(order: PaymentOrder) {
    try {
      await loadRazorpay();
      if (!window.Razorpay || !selectedEvent) throw new Error("Payment checkout is unavailable.");
      paymentHandled.current = false;
      const finishFailure = async (status: "FAILED" | "CANCELLED") => {
        if (paymentHandled.current) return;
        paymentHandled.current = true;
        await markPayment(status, order.registrationId);
        replaceView(status === "FAILED" ? "PAYMENT_FAILED" : "PAYMENT_CANCELLED");
      };
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Soft Shine Cosmetic",
        description: selectedEvent.eventName,
        order_id: order.orderId,
        method: process.env.NODE_ENV === "development" ? "card" : undefined,
        config: process.env.NODE_ENV === "development" ? {
          display: {
            blocks: { cards_only: { name: "Cards", instruments: [{ method: "card" }] } },
            sequence: ["block.cards_only"],
            preferences: { show_default_blocks: false }
          }
        } : undefined,
        prefill: { name: form.visitorName, email: form.email, contact: form.phone },
        notes: { registration_id: order.registrationReference },
        theme: { color: "#b76e79" },
        handler: async (response: RazorpaySuccessResponse) => {
          if (paymentHandled.current) return;
          paymentHandled.current = true;
          try {
            const verifyResponse = await fetch("/api/registrations/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId: order.registrationId, razorpay_payment_id: response.razorpay_payment_id, razorpay_order_id: response.razorpay_order_id, razorpay_signature: response.razorpay_signature }) });
            const payload = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(payload.error ?? "Payment verification failed.");
            setSuccessReceipt({ ticketId: order.registrationId, registrationId: payload.registrationId, eventName: selectedEvent.eventName, visitorName: form.visitorName, amount: payload.amount, paymentId: response.razorpay_payment_id, venue: selectedEvent.venue, startDate: selectedEvent.startDate, endDate: selectedEvent.endDate });
            setView("PAYMENT_SUCCESS");
          } catch (error) {
            setFlowError(error instanceof Error ? error.message : "Payment verification failed.");
            await markPayment("FAILED", order.registrationId);
            replaceView("PAYMENT_FAILED");
          }
        },
        modal: { ondismiss: () => { void finishFailure("CANCELLED"); } }
      });
      checkout.on("payment.failed", (response) => {
        const failure = response as { error?: { description?: string; reason?: string } };
        setFlowError(failure.error?.description ?? failure.error?.reason ?? "Payment could not be completed.");
        void finishFailure("FAILED");
      });
      checkout.open();
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "Payment checkout is unavailable.");
      await markPayment("FAILED", order.registrationId);
      replaceView("PAYMENT_FAILED");
    }
  }

  async function beginPayment() {
    if (!selectedEvent) return;
    setFlowError("");
    const parsed = registrationSchema.safeParse({ ...form, eventId: selectedEvent.id });
    if (!parsed.success) { setFlowError(firstZodError(parsed.error)); return; }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/registrations/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...parsed.data, registrationId: paymentOrder?.registrationId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "We could not start registration.");
      const order = payload as PaymentOrder;
      setPaymentOrder(order);
      pushView("PAYMENT");
      void openCheckout(order);
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "We could not start registration.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function downloadTicket() {
    if (!successReceipt) return;
    setIsDownloadingTicket(true);
    setFlowError("");
    try {
      const response = await fetch(`/api/registrations/ticket?registrationId=${encodeURIComponent(successReceipt.ticketId)}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "We could not create your ticket.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${successReceipt.registrationId}-ticket.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "We could not create your ticket.");
    } finally {
      setIsDownloadingTicket(false);
    }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactState({ loading: true, message: "", error: "" });
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contact) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not send message.");
      setContact({ name: "", phone: "", email: "", message: "" });
      setContactState({ loading: false, message: "Thanks — your message is with the Soft Shine team.", error: "" });
    } catch (error) {
      setContactState({ loading: false, message: "", error: error instanceof Error ? error.message : "Could not send message." });
    }
  }

  return (
    <main className="min-h-screen overflow-clip">
      <header className="fixed inset-x-0 top-0 z-30 h-[70px] border-b border-line/80 bg-white/85 backdrop-blur-xl md:h-[78px]">
        <div className="mx-auto flex h-full w-[min(calc(100%-30px),1180px)] items-center justify-between gap-7 md:w-[min(calc(100%-48px),1180px)]">
          <button type="button" aria-label={t("home")} className="shrink-0 border-0 bg-transparent p-0" onClick={() => navTo("home")}><SiteLogo src={settings.siteLogo ?? "/LOGO.png"} /></button>
          <nav aria-label={t("primaryNavigation")} className="ml-auto hidden items-center gap-8 lg:flex">
            <button type="button" className="text-sm font-semibold text-slate-600 transition hover:text-rose" onClick={() => navTo("exhibitions")}>{t("exhibitions")}</button>
            <button type="button" className="text-sm font-semibold text-slate-600 transition hover:text-rose" onClick={() => navTo("about")}>{t("about")}</button>
            <button type="button" className="text-sm font-semibold text-slate-600 transition hover:text-rose" onClick={() => navTo("contact")}>{t("contact")}</button>
          </nav>
          <button type="button" className="hidden min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-white transition hover:bg-slate-700 lg:inline-flex lg:items-center lg:justify-center" onClick={() => navTo("exhibitions")}>{t("registerNow")}</button>
          <button type="button" aria-label={language === "en" ? t("switchToGujarati") : t("switchToEnglish")} className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-full border border-line bg-white px-3 text-[.68rem] font-bold text-ink transition hover:border-rose hover:text-rose lg:ml-0" onClick={() => setLanguage(language === "en" ? "gu" : "en")}><span className={language === "en" ? "text-rose" : "text-muted"}>EN</span><span className="text-muted">/</span><span className={language === "gu" ? "text-rose" : "text-muted"}>ગુજ</span></button>
          <button type="button" aria-label={t("mobileContact")} className="grid size-10 place-items-center rounded-full border border-line text-ink transition hover:border-rose hover:text-rose lg:hidden" onClick={() => navTo("contact")}><Icon name="phone" size={17} /></button>
          <button type="button" aria-label={mobileMenu ? t("close") : t("openMenu")} aria-expanded={mobileMenu} aria-controls="mobile-navigation" className="grid size-11 place-items-center border-0 bg-transparent lg:hidden" onClick={() => setMobileMenu((open) => !open)}><Icon name={mobileMenu ? "close" : "menu"} /></button>
          {mobileMenu && <nav id="mobile-navigation" aria-label={t("mobileNavigation")} className="absolute inset-x-4 top-[calc(100%+1px)] grid gap-1 rounded-xl border border-line bg-white p-2 shadow-[0_8px_24px_rgb(17_24_39_/_10%)] lg:hidden">
            <button type="button" className="rounded-lg p-3 text-left text-sm font-semibold text-muted hover:bg-cream hover:text-ink" onClick={() => navTo("exhibitions")}>{t("exhibitions")}</button>
            <button type="button" className="rounded-lg p-3 text-left text-sm font-semibold text-muted hover:bg-cream hover:text-ink" onClick={() => navTo("about")}>{t("about")}</button>
            <button type="button" className="rounded-lg p-3 text-left text-sm font-semibold text-muted hover:bg-cream hover:text-ink" onClick={() => navTo("contact")}>{t("contact")}</button>
            <button type="button" className="mt-1 min-h-11 rounded-full bg-ink px-4 text-sm font-bold text-white" onClick={() => navTo("exhibitions")}>{t("registerNow")}</button>
          </nav>}
        </div>
      </header>

      <section id="home" className="bg-[#f3eee9] pt-[70px] md:pt-[78px]">
        <BeautyStillLife image={settings.heroImage ?? "/Hero Banner.png"} />
      </section>

      <section id="exhibitions" className="scroll-mt-16 bg-white py-20 md:scroll-mt-20 md:py-28">
        <div className="mx-auto w-[min(calc(100%-30px),1180px)] md:w-[min(calc(100%-48px),1180px)]">
          <div className="mb-12 flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] font-normal leading-none tracking-[-.03em]">{t("activeExhibitions")}</h2>
          </div>
          {eventsQuery.isLoading && <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"><div className="h-[430px] animate-pulse rounded-[14px] bg-slate-100" /><div className="hidden h-[430px] animate-pulse rounded-[14px] bg-slate-100 md:block" /><div className="hidden h-[430px] animate-pulse rounded-[14px] bg-slate-100 lg:block" /></div>}
          {eventsQuery.isError && <div className="rounded-[14px] border border-dashed border-slate-300 bg-cream px-6 py-12 text-center"><h3 className="font-display text-3xl font-normal">{t("eventsUnavailable")}</h3><p className="mt-2 text-muted">{t("eventsUnavailableDescription")}</p></div>}
          {!eventsQuery.isLoading && !eventsQuery.isError && events.length === 0 && <div className="rounded-[14px] border border-dashed border-slate-300 bg-cream px-6 py-12 text-center"><h3 className="font-display text-3xl font-normal">{t("moreBeautyMoments")}</h3><p className="mt-2 text-muted">{t("noEvents")}</p></div>}
          {!eventsQuery.isLoading && !eventsQuery.isError && events.length > 0 && <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{events.map((event) => <EventCard key={event.id} event={event} onRegister={registerForEvent} />)}</div>}
        </div>
      </section>

      <section id="about" className="scroll-mt-16 bg-[#eff5f5] py-20 md:scroll-mt-20 md:py-28">
        <div className="mx-auto w-[min(calc(100%-30px),1180px)] md:w-[min(calc(100%-48px),1180px)]">
          <div className="grid items-start gap-12 lg:grid-cols-[.95fr_1.05fr] lg:gap-28">
            <div>
              <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[.95] tracking-[-.03em]">{t("aboutHeading")}</h2>
              <p className="mt-6 max-w-xl text-[.98rem] leading-7 text-muted">{aboutText}</p>
              <p className="mt-4 max-w-xl text-[.98rem] leading-7 text-muted">{t("aboutSupport")}</p>
              <div className="mt-10 grid gap-0 sm:grid-cols-2">
                {[
                  [t("beautyProducts"), t("beautyProductsDescription")],
                  [t("wholesaleSupply"), t("wholesaleSupplyDescription")],
                  [t("qualityFocused"), t("qualityFocusedDescription")],
                  [t("trustedPartnership"), t("trustedPartnershipDescription")]
                ].map(([title, text]) => <div key={title} className="border-t border-[#cfdddd] py-4 pr-5"><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted">{text}</p></div>)}
              </div>
            </div>
            <div className="rounded-[14px] bg-plum p-6 text-white sm:p-10">
              <h3 className="font-display text-4xl font-normal tracking-[-.03em]">{t("beautyEveryDetail")}</h3>
              <div className="mt-8 grid grid-cols-2">
                {[t("makeup"), t("skincare"), t("nailCare"), t("hairBeauty"), t("beautyAccessories"), t("professionalCosmetics")].map((category) => <div key={category} className="flex items-center gap-3 border-t border-white/15 py-4 text-sm text-slate-200"><span className="size-1.5 rounded-full bg-[#d9a5ad]" />{category}</div>)}
              </div>
              <div className="mt-11 border-t border-white/20 pt-8">
                <h4 className="font-display text-3xl font-normal">{t("promise")}</h4>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">{t("promiseDescription")}</p>
                <div className="mt-7 grid grid-cols-3 gap-3"><div><strong className="block text-sm">{t("qualityFirst")}</strong><span className="mt-1 block text-xs leading-5 text-slate-400">{t("thoughtfulSourcing")}</span></div><div><strong className="block text-sm">{t("reliableSupply")}</strong><span className="mt-1 block text-xs leading-5 text-slate-400">{t("readyForBusiness")}</span></div><div><strong className="block text-sm">{t("customerFocus")}</strong><span className="mt-1 block text-xs leading-5 text-slate-400">{t("hereLongTerm")}</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f2fa] py-20 md:py-28">
        <div className="mx-auto grid w-[min(calc(100%-30px),1180px)] items-center gap-12 md:w-[min(calc(100%-48px),1180px)] lg:grid-cols-[.9fr_1.1fr] lg:gap-28">
          <div className="min-h-[300px] rounded-[14px] border border-dashed border-[#cdbed4] bg-[#f3edf5] sm:min-h-[360px]" aria-label={t("communityImagePlaceholder")} />
          <div>
            <h2 className="max-w-xl font-display text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[.95] tracking-[-.03em]">{t("connectingCommunity")}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">{t("connectingDescription")}</p>
            <button type="button" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-6 text-sm font-bold transition hover:border-rose hover:text-rose" onClick={() => navTo("exhibitions")}>{t("exploreExhibitions")} <Icon name="arrow" size={17} /></button>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-16 bg-white py-20 md:scroll-mt-20 md:py-28">
        <div className="mx-auto grid w-[min(calc(100%-30px),1180px)] gap-12 md:w-[min(calc(100%-48px),1180px)] lg:grid-cols-[.8fr_1.2fr] lg:gap-32">
          <div>
            <h2 className="font-display text-[clamp(2.7rem,5vw,4.5rem)] font-normal leading-[.95] tracking-[-.03em]">{t("getInTouch")}</h2>
            <div className="mt-7">
              {settings.contactNumbers.map((person) => <div key={person.phone} className="flex items-center justify-between gap-5 border-t border-line py-5"><div><h3 className="text-sm font-bold">{localizeKnownCopy(person.name, language, t)}</h3><a className="mt-1 block text-sm text-muted hover:text-rose" href={"tel:" + person.phone.replace(/\s/g, "")}>{formatDigits(person.phone, locale)}</a></div><div className="flex gap-2"><a className="grid size-10 place-items-center rounded-full border border-line text-ink transition hover:border-rose hover:bg-[#fff4f5] hover:text-rose" aria-label={t("call") + " " + localizeKnownCopy(person.name, language, t)} href={"tel:" + person.phone.replace(/\s/g, "")}><Icon name="phone" size={17} /></a><a className="grid size-10 place-items-center rounded-full border border-line text-ink transition hover:border-rose hover:text-rose" aria-label={t("whatsapp") + " " + localizeKnownCopy(person.name, language, t)} href={"https://wa.me/" + person.phone.replace(/\D/g, "")} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={17} /></a></div></div>)}
            </div>
            <div className="mt-5 flex items-start gap-2.5 text-sm leading-6 text-muted"><Icon name="location" size={18} className="mt-0.5 shrink-0 text-rose" /><span>{settings.address}</span></div>
            <a href={settings.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 text-xs font-bold transition hover:border-rose hover:text-rose">{t("openGoogleMaps")} <Icon name="arrow" size={15} className="ml-2" /></a>
          </div>
          <form className="rounded-[14px] border border-line bg-[#fcfcfb] p-5 sm:p-9" onSubmit={sendMessage}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("name")} required><input required value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none transition focus:border-purple focus:bg-white" /></FormField>
              <FormField label={t("phone")}><input value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none transition focus:border-purple focus:bg-white" /></FormField>
              <FormField label={t("email")}><input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none transition focus:border-purple focus:bg-white" /></FormField>
              <div className="hidden sm:block" />
              <FormField label={t("message")} required><textarea required value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} className="mt-1.5 min-h-32 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none transition focus:border-purple focus:bg-white sm:col-span-2" /></FormField>
            </div>
            <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center"><span className="text-xs leading-5 text-success">{contactState.message}</span><span className="text-xs leading-5 text-[#b42318]">{contactState.error}</span><button disabled={contactState.loading} type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{contactState.loading ? t("sending") : t("sendMessage")} <Icon name="arrow" size={16} /></button></div>
          </form>
        </div>
      </section>

      <section id="sponsors" className="border-t border-line bg-[#f8f3ef] py-16 md:py-24">
        <div className="mx-auto w-[min(calc(100%-30px),1180px)] md:w-[min(calc(100%-48px),1180px)]">
          <div className="mb-9 max-w-xl">
            <h2 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-normal leading-none tracking-[-.03em]">{t("sponsors")}</h2>
            <p className="mt-4 text-sm leading-6 text-muted">{t("sponsorsDescription")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex h-36 items-center justify-center rounded-[14px] border border-line bg-white p-6"><img src="/sponsers/justgold.png" alt="JustGold" className="max-h-16 w-full object-contain" /></div>
            <div className="flex h-36 items-center justify-center rounded-[14px] border border-line bg-white p-6"><img src="/sponsers/makeup-empire.png" alt="Makeup Empire" className="h-full max-h-28 w-auto object-contain" /></div>
            <div className="flex h-36 items-center justify-center rounded-[14px] border border-line bg-white p-6"><img src="/sponsers/max-touch.png" alt="MaxTouch" className="max-h-14 w-full object-contain" /></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white py-14">
        <div className="mx-auto w-[min(calc(100%-30px),1180px)] md:w-[min(calc(100%-48px),1180px)]">
          <div className="grid gap-8 pb-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
            <div className="sm:col-span-2 lg:col-span-1"><SiteLogo src={settings.siteLogo ?? "/LOGO.png"} /><p className="mt-5 max-w-[240px] text-sm leading-6 text-muted">{footerText}</p></div>
            <div><h3 className="mb-4 text-[.68rem] font-bold uppercase tracking-[.12em]">{t("explore")}</h3><button type="button" className="mb-3 block text-left text-xs text-muted hover:text-rose" onClick={() => navTo("exhibitions")}>{t("exhibitions")}</button><button type="button" className="mb-3 block text-left text-xs text-muted hover:text-rose" onClick={() => navTo("about")}>{t("about")}</button><button type="button" className="block text-left text-xs text-muted hover:text-rose" onClick={() => navTo("contact")}>{t("contact")}</button></div>
            <div><h3 className="mb-4 text-[.68rem] font-bold uppercase tracking-[.12em]">{t("contact")}</h3>{settings.contactNumbers.map((person) => <a key={person.phone} href={"tel:" + person.phone.replace(/\s/g, "")} className="mb-3 block text-xs text-muted hover:text-rose">{formatDigits(person.phone, locale)}</a>)}<p className="text-xs leading-5 text-muted">{settings.address}</p></div>
            <div><h3 className="mb-4 text-[.68rem] font-bold uppercase tracking-[.12em]">{t("softShine")}</h3><p className="text-xs leading-5 text-muted">{t("softShineDescription")}</p><a href="/admin/login" className="mt-4 inline-block text-xs font-semibold text-muted hover:text-rose">{t("adminPortal")}</a></div>
          </div>
          <div className="flex flex-col gap-2 border-t border-line pt-5 text-[.7rem] text-muted sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Soft Shine Cosmetic. {t("allRights")}</span><span>{t("privacyTerms")}</span></div>
        </div>
      </footer>

      {view !== "HOME" && selectedEvent && <FlowOverlay view={view} event={selectedEvent} form={form} setForm={setForm} flowError={flowError} setFlowError={setFlowError} isSubmitting={isSubmitting} isDownloadingTicket={isDownloadingTicket} paymentOrder={paymentOrder} successReceipt={successReceipt} onClose={goHome} onBack={backFromFlow} onOpenRegistration={openRegistration} onPay={beginPayment} onRetry={() => void beginPayment()} onDownloadTicket={downloadTicket} onBackHome={goHome} />}
    </main>
  );
}

function FlowOverlay({ view, event, form, setForm, flowError, setFlowError, isSubmitting, isDownloadingTicket, paymentOrder, successReceipt, onClose, onBack, onOpenRegistration, onPay, onRetry, onDownloadTicket, onBackHome }: { view: View; event: EventRecord; form: RegistrationForm; setForm: (form: RegistrationForm) => void; flowError: string; setFlowError: (error: string) => void; isSubmitting: boolean; isDownloadingTicket: boolean; paymentOrder: PaymentOrder | null; successReceipt: SuccessReceipt | null; onClose: () => void; onBack: () => void; onOpenRegistration: () => void; onPay: () => void; onRetry: () => void; onDownloadTicket: () => void; onBackHome: () => void }) {
  const { language, t } = useLanguage();
  return <div className="animate-overlay-in fixed inset-0 z-40 grid items-end bg-ink/45 p-0 sm:place-items-center sm:p-3 md:p-6" data-flow-overlay="true" role="dialog" aria-modal="true" aria-label={view === "PAYMENT_SUCCESS" ? t("registrationSuccessful") : localizeKnownCopy(event.eventName, language, t)}>
    <div className="animate-panel-in relative max-h-[96vh] w-full overflow-y-auto rounded-t-[14px] border border-white/80 bg-cream sm:max-h-[calc(100vh-48px)] sm:max-w-[1040px] sm:rounded-[16px]">
      <button type="button" autoFocus aria-label={t("close")} className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full border border-line bg-white/95 text-ink hover:border-rose hover:text-rose" onClick={onClose}><Icon name="close" /></button>
      <div className="p-4 pb-7 sm:p-12">
        {view === "EVENT_DETAILS" && <EventDetails event={event} onBack={onBack} onRegister={onOpenRegistration} />}
        {view === "REGISTRATION" && <RegistrationView event={event} form={form} setForm={setForm} flowError={flowError} setFlowError={setFlowError} isSubmitting={isSubmitting} onBack={onBack} onPay={onPay} />}
        {view === "PAYMENT" && <PaymentView event={event} form={form} order={paymentOrder} onBack={onBack} />}
        {(view === "PAYMENT_CANCELLED" || view === "PAYMENT_FAILED") && <PaymentStatusView failed={view === "PAYMENT_FAILED"} error={flowError} onRetry={onRetry} onBack={onBack} />}
        {view === "PAYMENT_SUCCESS" && successReceipt && <SuccessView receipt={successReceipt} error={flowError} isDownloading={isDownloadingTicket} onDownload={onDownloadTicket} onBackHome={onBackHome} />}
      </div>
    </div>
  </div>;
}

function EventDetails({ event, onBack, onRegister }: { event: EventRecord; onBack: () => void; onRegister: () => void }) {
  const { language, t } = useLanguage();
  const locale = getSiteLocale(language);
  const eventName = localizeKnownCopy(event.eventName, language, t);
  const description = localizeKnownCopy(event.fullDescription || event.shortDescription, language, t);
  const venue = localizeKnownCopy(event.venue, language, t);
  const address = localizeKnownCopy(event.address, language, t);
  const city = localizeKnownCopy(event.city, language, t);
  const terms = localizeKnownCopy(event.termsAndConditions, language, t);
  return <div>
    <button type="button" onClick={onBack} className="mb-7 inline-flex items-center gap-2 border-0 bg-transparent p-0 text-xs font-bold text-muted hover:text-rose"><Icon name="arrow" size={16} className="rotate-180" /> {t("backToExhibitions")}</button>
    <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-10">
      <div className="aspect-[4/3] overflow-hidden rounded-[14px] bg-[#f3ecea]"><EventVisual event={event} detail /></div>
      <div className="pt-1 lg:pt-6">
        <p className="mb-3 text-[.7rem] font-extrabold uppercase tracking-[.14em] text-rose">{event.status === "LIVE" ? t("liveNow") : t("openForRegistration")}</p>
        <h2 className="max-w-2xl font-display text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[.95] tracking-[-.035em]">{eventName}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{description}</p>
        <div className="mt-7 grid gap-3 border-t border-line pt-5 text-sm text-muted">
          <div className="flex items-start gap-3"><Icon name="calendar" className="shrink-0 text-rose" /><span><strong className="mb-1 block text-[.67rem] uppercase tracking-[.07em] text-ink">{t("date")}</strong>{formatEventDate(event.startDate, event.endDate, locale)}</span></div>
          {event.startTime && <div className="flex items-start gap-3"><Icon name="clock" className="shrink-0 text-rose" /><span><strong className="mb-1 block text-[.67rem] uppercase tracking-[.07em] text-ink">{t("time")}</strong>{formatEventTime(event.startTime, locale)}{event.endTime ? " – " + formatEventTime(event.endTime, locale) : ""}</span></div>}
          <div className="flex items-start gap-3"><Icon name="location" className="shrink-0 text-rose" /><span><strong className="mb-1 block text-[.67rem] uppercase tracking-[.07em] text-ink">{t("venue")}</strong>{venue}<br />{address}, {city}</span></div>
        </div>
        {event.sponsorName && <div className="mt-5 flex items-center gap-3 text-xs text-muted">{event.sponsorLogo ? <img className="size-11 rounded-full border border-line bg-white object-contain" src={event.sponsorLogo} alt="" /> : <span className="grid size-11 place-items-center rounded-full border border-[#d8b8bd] bg-[#f8e9eb] font-display text-xl text-rose">{event.sponsorName[0]}</span>} <span>{t("presentedWith")} <strong className="text-ink">{event.sponsorName}</strong></span></div>}
        <p className="my-5 rounded-lg bg-[#fff4f5] px-4 py-3 text-xs leading-5 text-[#7f4a53]">{terms}</p>
        <div className="flex flex-wrap items-center gap-4"><button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rose px-6 text-sm font-bold text-white hover:bg-[#a85e6b]" onClick={onRegister}>{t("register")} <Icon name="arrow" size={17} /></button><span className="text-xs font-bold text-success">{formatNumber(event.availableSlots, locale)} {t("spotsAvailable")}</span></div>
      </div>
    </div>
  </div>;
}

function RegistrationView({ event, form, setForm, flowError, setFlowError, isSubmitting, onBack, onPay }: { event: EventRecord; form: RegistrationForm; setForm: (form: RegistrationForm) => void; flowError: string; setFlowError: (error: string) => void; isSubmitting: boolean; onBack: () => void; onPay: () => void }) {
  const { language, t } = useLanguage();
  const locale = getSiteLocale(language);
  const eventName = localizeKnownCopy(event.eventName, language, t);
  return <div>
    <button type="button" onClick={onBack} className="mb-7 inline-flex items-center gap-2 border-0 bg-transparent p-0 text-xs font-bold text-muted hover:text-rose"><Icon name="arrow" size={16} className="rotate-180" /> {t("backToEvent")}</button>
    <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
      <div>
        <p className="mb-3 text-[.7rem] font-extrabold uppercase tracking-[.14em] text-rose">{t("yourDetails")}</p>
        <h2 className="mb-12 font-display text-[clamp(2.4rem,4vw,3.8rem)] font-normal leading-[.95] tracking-[-.03em]">{t("reservePlace")}</h2>
        <p className="mt-4 text-sm leading-6 text-muted">{t("completeDetails")} <strong className="text-ink">{eventName}</strong>.</p>
        <div className="my-6 flex items-start gap-3 rounded-lg border border-[#e5c3c9] bg-[#fff5f6] px-4 py-3 text-xs leading-5 text-[#804b54]"><Icon name="users" className="shrink-0 text-rose" size={18} /><span>{t("exclusiveVisitors")}</span></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fullName")} required><input required value={form.visitorName} onChange={(e) => { setFlowError(""); setForm({ ...form, visitorName: e.target.value }); }} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-purple focus:bg-white" placeholder={t("yourFullName")} autoComplete="name" /></FormField>
          <FormField label={t("phoneNumber")} required><div className="mt-1.5 flex"><span className="inline-flex items-center rounded-l-lg border border-r-0 border-line bg-slate-100 px-3 text-sm font-normal text-muted">{formatDigits("+91", locale)}</span><input required type="tel" value={form.phone.replace(/^\+91/, "")} onChange={(e) => { setFlowError(""); setForm({ ...form, phone: e.target.value }); }} className="min-w-0 flex-1 rounded-r-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-purple focus:bg-white" placeholder={t("mobilePlaceholder")} inputMode="numeric" autoComplete="tel" /></div></FormField>
          <FormField label={t("emailAddress")}><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-purple focus:bg-white" placeholder="you@example.com" autoComplete="email" /></FormField>
          <FormField label={t("city")} required><input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-purple focus:bg-white" placeholder={t("yourCity")} autoComplete="address-level2" /></FormField>
          <FormField label={t("category")} required><select required value={form.category} onChange={(e) => { setFlowError(""); setForm({ ...form, category: e.target.value as RegistrationForm["category"] }); }} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-purple focus:bg-white"><option value="Parlour Owner">{t("parlourOwner")}</option><option value="Others">{t("others")}</option></select></FormField>
          <FormField label={t("gender")} required><input readOnly value={t("female")} className="mt-1.5 w-full rounded-lg border border-line bg-[#f3f0f4] px-3 py-3 text-sm font-normal text-muted outline-none" /></FormField>
        </div>
        <label className="mt-5 flex items-start gap-2.5 text-xs leading-5 text-muted"><input required type="checkbox" checked={form.termsAccepted} onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })} className="mt-1 size-4 accent-rose" /> <span>{t("termsAgree")}</span></label>
        {flowError && <p className="mt-4 text-xs leading-5 text-[#b42318]" role="alert">{flowError}</p>}
      </div>
      <aside className="self-start rounded-[14px] border border-line bg-white p-5 sm:p-6">
        <h3 className="mb-8 font-display text-3xl font-normal">{t("pricingPayment")}</h3>
        <p className="mt-2 text-xs text-muted">{eventName}</p>
        <div className="mt-5 border-t border-line pt-1"><div className="flex justify-between gap-4 border-b border-line py-4 text-sm text-muted"><span>{t("registrationFee")}</span><strong className="text-ink">{formatINR(event.registrationPrice, locale)}</strong></div><div className="flex justify-between gap-4 py-4 text-sm font-bold"><span>{t("totalAmount")}</span><strong className="text-lg">{formatINR(event.registrationPrice, locale)}</strong></div></div>
        <div className="mb-5 mt-3 flex items-center gap-2 text-xs text-muted"><Icon name="lock" size={16} className="text-success" /> {t("securePayment")}</div>
        <button type="button" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-rose px-5 text-sm font-bold text-white transition hover:bg-[#a85e6b] disabled:cursor-not-allowed disabled:opacity-60" onClick={onPay}>{isSubmitting ? t("preparingPayment") : t("payAndRegister") + " " + formatINR(event.registrationPrice, locale)} <Icon name="arrow" size={17} /></button>
        <button type="button" className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full border border-line px-4 text-xs font-bold text-muted hover:border-rose hover:text-rose" onClick={onBack}>{t("cancelRegistration")}</button>
      </aside>
    </div>
  </div>;
}

function PaymentView({ event, form, order, onBack }: { event: EventRecord; form: RegistrationForm; order: PaymentOrder | null; onBack: () => void }) {
  const { language, t } = useLanguage();
  const eventName = localizeKnownCopy(event.eventName, language, t);
  return <div className="grid min-h-[420px] place-items-center text-center">
    <div><div className="mx-auto mb-6 size-12 animate-spin-soft rounded-full border-2 border-[#e8d6da] border-t-rose" /><h2 className="font-display text-4xl font-normal">{t("openingCheckout")}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">{t("paymentSaved")} {eventName}. {t("completePayment")}</p><p className="mt-3 text-xs text-muted">{form.visitorName} · {order?.registrationReference ?? t("pendingRegistration")}</p><button type="button" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 text-xs font-bold text-muted hover:border-rose hover:text-rose" onClick={onBack}>{t("backToRegistration")}</button></div>
  </div>;
}

function PaymentStatusView({ failed, error, onRetry, onBack }: { failed: boolean; error: string; onRetry: () => void; onBack: () => void }) {
  const { t } = useLanguage();
  return <div className="grid min-h-[420px] place-items-center text-center">
    <div className="max-w-lg"><div className={"mx-auto mb-6 grid size-24 place-items-center rounded-full " + (failed ? "bg-[#fff3f3] text-[#c24141]" : "bg-[#fff4f5] text-rose")}><Icon name={failed ? "close" : "arrow"} size={48} className={failed ? "" : "rotate-90"} /></div><p className={"mb-3 text-[.7rem] font-extrabold uppercase tracking-[.14em] " + (failed ? "text-[#c24141]" : "text-rose")}>{failed ? t("paymentUnsuccessful") : t("paymentCancelled")}</p><h2 className="font-display text-4xl font-normal">{t("notConfirmed")}</h2><p className="mt-4 text-sm leading-6 text-muted">{error || (failed ? t("paymentInterrupted") : t("razorpayClosed"))}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button type="button" className="inline-flex min-h-11 items-center justify-center rounded-full bg-rose px-5 text-sm font-bold text-white hover:bg-[#a85e6b]" onClick={onRetry}>{t("tryAgain")}</button><button type="button" className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-bold text-ink hover:border-rose hover:text-rose" onClick={onBack}>{t("backToEvent")}</button></div></div>
  </div>;
}

function SuccessView({ receipt, error, isDownloading, onDownload, onBackHome }: { receipt: SuccessReceipt; error: string; isDownloading: boolean; onDownload: () => void; onBackHome: () => void }) {
  const { language, t } = useLanguage();
  const locale = getSiteLocale(language);
  const eventName = localizeKnownCopy(receipt.eventName, language, t);
  const venue = localizeKnownCopy(receipt.venue, language, t);
  const date = formatEventDate(receipt.startDate, receipt.endDate, locale);
  return <div className="grid items-center gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
    <TicketPreview receipt={receipt} eventName={eventName} date={date} locale={locale} />
    <div><p className="mb-3 text-[.7rem] font-extrabold uppercase tracking-[.14em] text-success">{t("paymentVerified")}</p><h2 className="font-display text-[clamp(2.7rem,5vw,4.5rem)] font-normal leading-[.95] tracking-[-.035em]">{t("registrationSuccessful")}</h2><p className="mt-4 text-sm leading-6 text-muted">{t("ticketInstruction")}</p><div className="my-6 overflow-hidden rounded-[14px] border border-line bg-white"><div className="flex items-center justify-between gap-4 bg-ink p-5 text-white"><div><p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-white/65">Soft Shine Cosmetic</p><h3 className="mt-2 font-display text-3xl font-normal leading-none">{eventName}</h3></div><span className="rounded-full bg-[#dff5e3] px-2.5 py-1 text-[.62rem] font-extrabold uppercase tracking-[.1em] text-success">{t("paid")}</span></div><div className="grid grid-cols-2 gap-5 p-5"><div><span className="mb-1 block text-[.63rem] font-bold uppercase tracking-[.1em] text-muted">{t("attendee")}</span><strong className="text-sm">{receipt.visitorName}</strong></div><div><span className="mb-1 block text-[.63rem] font-bold uppercase tracking-[.1em] text-muted">{t("registrationId")}</span><strong className="text-sm">{receipt.registrationId}</strong></div><div><span className="mb-1 block text-[.63rem] font-bold uppercase tracking-[.1em] text-muted">{t("date")}</span><strong className="text-sm">{date}</strong></div><div><span className="mb-1 block text-[.63rem] font-bold uppercase tracking-[.1em] text-muted">{t("amountPaid")}</span><strong className="text-sm">{formatINR(receipt.amount, locale)}</strong></div><div className="col-span-2"><span className="mb-1 block text-[.63rem] font-bold uppercase tracking-[.1em] text-muted">{t("venue")}</span><strong className="text-sm">{venue}</strong></div></div></div>{error && <p className="mb-4 text-xs leading-5 text-[#b42318]" role="alert">{error}</p>}<div className="flex flex-wrap gap-3"><button type="button" disabled={isDownloading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rose px-6 text-sm font-bold text-white transition hover:bg-[#a85e6b] disabled:cursor-wait disabled:opacity-60" onClick={onDownload}>{isDownloading ? t("creatingTicketPdf") : t("downloadTicketPdf")} <Icon name="download" size={17} /></button><button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line px-6 text-sm font-bold text-ink hover:border-rose hover:text-rose" onClick={onBackHome}>{t("backToExhibitions")} <Icon name="arrow" size={17} /></button></div></div>
  </div>;
}

function TicketPreview({ receipt, eventName, date, locale }: { receipt: SuccessReceipt; eventName: string; date: string; locale: SiteLocale }) {
  const { t } = useLanguage();
  return <div className="relative select-none">
    <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_24px_60px_-24px_rgba(17,24,39,0.45)]">
      <div className="flex items-center justify-between gap-4 bg-ink px-6 py-5 text-white">
        <div><p className="text-[.62rem] font-bold uppercase tracking-[.14em] text-white/65">Soft Shine Cosmetic</p><h3 className="mt-1.5 font-display text-2xl font-normal leading-none blur-[3px]">{eventName}</h3></div>
        <span className="shrink-0 rounded-full bg-[#dff5e3] px-2.5 py-1 text-[.6rem] font-extrabold uppercase tracking-[.1em] text-success blur-[1.5px]">{t("paid")}</span>
      </div>
      <div className="grid gap-4 px-6 py-6 blur-[3px]">
        <div className="grid grid-cols-2 gap-4"><div><span className="block text-[.6rem] font-bold uppercase tracking-[.1em] text-muted">{t("attendee")}</span><strong className="mt-1 block text-sm">{receipt.visitorName}</strong></div><div><span className="block text-[.6rem] font-bold uppercase tracking-[.1em] text-muted">{t("registrationId")}</span><strong className="mt-1 block text-sm">{receipt.registrationId}</strong></div></div>
        <div className="flex items-center gap-3 border-y border-dashed border-line py-4"><Icon name="calendar" size={16} className="shrink-0 text-muted" /><div><span className="block text-[.6rem] font-bold uppercase tracking-[.1em] text-muted">{t("date")}</span><strong className="mt-0.5 block text-sm">{date}</strong></div><div className="ml-auto"><span className="block text-[.6rem] font-bold uppercase tracking-[.1em] text-muted">{t("amountPaid")}</span><strong className="mt-0.5 block text-sm">{formatINR(receipt.amount, locale)}</strong></div></div>
        <div className="flex items-center justify-between gap-4"><span className="text-[.6rem] font-bold uppercase tracking-[.1em] text-muted">{t("registrationId")}</span><div className="flex items-end gap-1.5">{Array.from({ length: 18 }).map((_, i) => <span key={i} className={["h-2.5 w-[3px]", "h-4 w-[3px]", "h-3 w-[3px]"][i % 3] + " rounded-[1px] bg-ink"} />)}</div></div>
      </div>
    </div>
    <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-ink/75 px-4 py-2 text-[.62rem] font-extrabold uppercase tracking-[.14em] text-white shadow-lg backdrop-blur-md"><Icon name="lock" size={13} /> {t("downloadTicketPdf")}</span></div>
  </div>;
}
