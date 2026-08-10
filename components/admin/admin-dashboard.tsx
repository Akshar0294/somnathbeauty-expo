"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteLogo } from "@/components/site/site-logo";
import { formatDateTime, formatINR } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { EventRecord, WebsiteSettings } from "@/types/domain";
import { fallbackSettings } from "@/types/domain";

type Tab = "overview" | "events" | "registrations" | "payments" | "sponsors" | "messages" | "settings";
type RegistrationRow = { id: string; registrationId: string; visitorName: string; phone: string; email: string | null; city: string; category: string; gender: string; paymentStatus: string; registrationStatus: string; amount: number; createdAt: string; eventName: string | null };
type PaymentRow = { id: string; registrationId: string | null; eventName: string | null; visitorName: string | null; amount: number; razorpayOrderId: string; razorpayPaymentId: string | null; status: string; createdAt: string };
type MessageRow = { id: string; name: string; phone: string; email: string; message: string; status: "UNREAD" | "READ"; createdAt: string };

type EventDraft = {
  eventName: string;
  shortDescription: string;
  fullDescription: string;
  eventImage: string;
  galleryImages: string[];
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  registrationPrice: number;
  maximumCapacity: number;
  availableSlots: number;
  registrationOpen: boolean;
  registrationDeadline: string;
  status: EventRecord["status"];
  sponsorName: string;
  sponsorLogo: string;
  sponsorWebsite: string;
  termsAndConditions: string;
  featured: boolean;
};

const blankEvent: EventDraft = {
  eventName: "",
  shortDescription: "",
  fullDescription: "",
  eventImage: "",
  galleryImages: [],
  venue: "Kapishwar Partyplot, Veraval",
  address: "",
  city: "Veraval",
  state: "Gujarat",
  country: "India",
  startDate: "2026-09-12",
  endDate: "2026-09-13",
  startTime: "10:00",
  endTime: "18:00",
  registrationPrice: 100,
  maximumCapacity: 500,
  availableSlots: 500,
  registrationOpen: false,
  registrationDeadline: "",
  status: "OPEN",
  sponsorName: "",
  sponsorLogo: "",
  sponsorWebsite: "",
  termsAndConditions: "These expos are exclusively for female visitors. Please carry a valid photo ID.",
  featured: false
};

const fieldClass = "mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-2.5 text-sm font-normal outline-none focus:border-purple focus:bg-white";

async function adminJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed.");
  return payload as T;
}

function draftFromEvent(event: EventRecord): EventDraft {
  return {
    eventName: event.eventName,
    shortDescription: event.shortDescription,
    fullDescription: event.fullDescription,
    eventImage: event.eventImage ?? "",
    galleryImages: event.galleryImages ?? [],
    venue: event.venue,
    address: event.address,
    city: event.city,
    state: event.state,
    country: event.country,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime ?? "",
    endTime: event.endTime ?? "",
    registrationPrice: event.registrationPrice,
    maximumCapacity: event.maximumCapacity,
    availableSlots: event.availableSlots,
    registrationOpen: event.registrationOpen,
    registrationDeadline: event.registrationDeadline ? event.registrationDeadline.slice(0, 16) : "",
    status: event.status,
    sponsorName: event.sponsorName ?? "",
    sponsorLogo: event.sponsorLogo ?? "",
    sponsorWebsite: event.sponsorWebsite ?? "",
    termsAndConditions: event.termsAndConditions,
    featured: event.featured
  };
}

export function AdminDashboard({ email }: { email: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState<EventDraft>(blankEvent);
  const [settingsDraft, setSettingsDraft] = useState<WebsiteSettings>(fallbackSettings);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const events = await adminJson<EventRecord[]>("/api/admin/events");
      if (events[0]) {
        setEditingId(events[0].id);
        setEventDraft(draftFromEvent(events[0]));
      }
      return events;
    }
  });
  const registrationsQuery = useQuery({ queryKey: ["admin-registrations"], queryFn: () => adminJson<RegistrationRow[]>("/api/admin/registrations") });
  const paymentsQuery = useQuery({ queryKey: ["admin-payments"], queryFn: () => adminJson<PaymentRow[]>("/api/admin/payments") });
  const messagesQuery = useQuery({ queryKey: ["admin-messages"], queryFn: () => adminJson<MessageRow[]>("/api/admin/messages") });
  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const settings = await adminJson<WebsiteSettings>("/api/admin/settings");
      setSettingsDraft(settings);
      return settings;
    }
  });
  const events = eventsQuery.data ?? [];
  const registrations = registrationsQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  const paidRegistrations = registrations.filter((row) => row.paymentStatus === "PAID");
  const revenue = paidRegistrations.reduce((total, row) => total + row.amount, 0);
  const activeEvents = events.filter((event) => event.registrationOpen && ["OPEN", "LIVE"].includes(event.status));
  const filteredRegistrations = registrations.filter((row) => [row.registrationId, row.visitorName, row.phone, row.eventName ?? ""].join(" ").toLowerCase().includes(search.toLowerCase()));

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/admin/login");
  }

  function editEvent(event: EventRecord) {
    setEditingId(event.id);
    setEventDraft(draftFromEvent(event));
    setTab("events");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function upload(file: File, folder: string) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", folder);
    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Upload failed.");
    return payload.url as string;
  }

  async function saveEvent() {
    setBusy(true);
    setNotice("");
    try {
      if (!editingId) throw new Error("No expo is available to edit.");
      await adminJson<EventRecord>("/api/admin/events", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...eventDraft, id: editingId }) });
      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      setNotice("Event saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save event.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    try {
      await adminJson("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsDraft) });
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setNotice("Website settings saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  async function updateMessage(message: MessageRow, status: "READ" | "UNREAD") {
    await adminJson("/api/admin/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: message.id, status }) });
    await queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
  }

  async function deleteMessage(id: string) {
    await adminJson("/api/admin/messages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
  }

  function exportCsv() {
    const header = ["Registration ID", "Visitor", "Phone", "Email", "City", "Category", "Event", "Amount", "Payment", "Date"];
    const rows = registrations.map((row) => [row.registrationId, row.visitorName, row.phone, row.email ?? "", row.city, row.category, row.eventName ?? "", row.amount, row.paymentStatus, row.createdAt]);
    const csv = [header, ...rows].map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "soft-shine-registrations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const nav: Array<[Tab, string]> = [["overview", "Overview"], ["events", "Events"], ["registrations", "Registrations"], ["payments", "Payments"], ["sponsors", "Sponsors"], ["messages", "Messages"], ["settings", "Website settings"]];

  return <main className="admin-shell min-h-screen bg-[#f7f8fb]">
    <header className="border-b border-line bg-white"><div className="mx-auto flex min-h-[70px] w-[min(calc(100%-30px),1180px)] items-center justify-between gap-5 md:w-[min(calc(100%-48px),1180px)]"><SiteLogo compact /><div className="flex items-center gap-3"><span className="hidden text-xs text-muted sm:inline">{email}</span><button type="button" className="rounded-full border border-line px-4 py-2 text-xs font-bold text-muted hover:border-rose hover:text-rose" onClick={signOut}>Sign out</button></div></div></header>
    <nav className="overflow-x-auto border-b border-line bg-white"><div className="mx-auto flex w-[min(calc(100%-30px),1180px)] md:w-[min(calc(100%-48px),1180px)]">{nav.map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)} className={"border-b-2 px-4 py-4 text-xs font-bold whitespace-nowrap transition " + (tab === key ? "border-rose text-ink" : "border-transparent text-muted hover:text-rose")}>{label}{key === "messages" && messages.some((message) => message.status === "UNREAD") ? <span className="ml-2 inline-grid size-4 place-items-center rounded-full bg-rose text-[.6rem] text-white">{messages.filter((message) => message.status === "UNREAD").length}</span> : null}</button>)}</div></nav>
    <div className="mx-auto w-[min(calc(100%-30px),1180px)] py-8 md:w-[min(calc(100%-48px),1180px)]">
      <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[.68rem] font-bold uppercase tracking-[.14em] text-rose">Soft Shine admin</p><h1 className="mt-2 font-display text-4xl font-normal tracking-[-.035em]">{nav.find(([key]) => key === tab)?.[1]}</h1><p className="mt-2 text-sm text-muted">Keep every public detail current from one place.</p></div><div className="flex gap-2">{notice && <span className="self-center text-xs text-success">{notice}</span>}</div></div>
      {tab === "overview" && <Overview events={events} registrations={registrations} activeEvents={activeEvents} revenue={revenue} paidCount={paidRegistrations.length} messages={messages} onEvents={() => setTab("events")} />}
      {tab === "events" && <EventsPanel events={events} draft={eventDraft} setDraft={setEventDraft} editingId={editingId} onEdit={editEvent} onSave={saveEvent} onUpload={upload} busy={busy} />}
      {tab === "registrations" && <RegistrationsPanel rows={filteredRegistrations} search={search} setSearch={setSearch} onExport={exportCsv} />}
      {tab === "payments" && <PaymentsPanel rows={payments} />}
      {tab === "sponsors" && <SponsorsPanel events={events} onEdit={editEvent} />}
      {tab === "messages" && <MessagesPanel rows={messages} onRead={updateMessage} onDelete={deleteMessage} />}
      {tab === "settings" && <SettingsPanel settings={settingsDraft} setSettings={setSettingsDraft} onUpload={upload} onSave={saveSettings} busy={busy} loading={settingsQuery.isLoading} />}
    </div>
  </main>;
}

function Overview({ events, registrations, activeEvents, revenue, paidCount, messages, onEvents }: { events: EventRecord[]; registrations: RegistrationRow[]; activeEvents: EventRecord[]; revenue: number; paidCount: number; messages: MessageRow[]; onEvents: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = registrations.filter((row) => row.createdAt.slice(0, 10) === today).length;
  const stats = [["Total events", events.length], ["Active events", activeEvents.length], ["Registrations", registrations.length], ["Paid registrations", paidCount], ["Revenue", formatINR(revenue)]];
  return <div className="grid gap-6"><div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{stats.map(([label, value]) => <div key={String(label)} className="rounded-xl border border-line bg-white p-5"><span className="block text-xs text-muted">{label}</span><strong className="mt-2 block font-display text-3xl font-normal">{value}</strong></div>)}</div><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-xl border border-line bg-white"><div className="flex items-center justify-between border-b border-line p-5"><h2 className="font-display text-2xl font-normal">Upcoming events</h2><button type="button" className="text-xs font-bold text-rose" onClick={onEvents}>Manage</button></div>{activeEvents.length === 0 ? <p className="p-5 text-sm text-muted">No active events.</p> : <div>{activeEvents.slice(0, 5).map((event) => <div key={event.id} className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 last:border-0"><div><strong className="block text-sm">{event.eventName}</strong><span className="mt-1 block text-xs text-muted">{event.startDate} · {event.availableSlots} slots</span></div><span className="rounded-full bg-[#eaf7ed] px-2 py-1 text-[.62rem] font-bold uppercase text-success">{event.status}</span></div>)}</div>}</section><section className="rounded-xl border border-line bg-white p-5"><h2 className="font-display text-2xl font-normal">Today</h2><div className="mt-5 grid gap-4 border-t border-line pt-5"><div><span className="block text-xs text-muted">New registrations</span><strong className="mt-1 block font-display text-3xl font-normal">{todayCount}</strong></div><div><span className="block text-xs text-muted">Unread messages</span><strong className="mt-1 block font-display text-3xl font-normal">{messages.filter((message) => message.status === "UNREAD").length}</strong></div></div></section></div></div>;
}

function EventsPanel({ events, draft, setDraft, editingId, onEdit, onSave, onUpload, busy }: { events: EventRecord[]; draft: EventDraft; setDraft: (draft: EventDraft) => void; editingId: string | null; onEdit: (event: EventRecord) => void; onSave: () => void; onUpload: (file: File, folder: string) => Promise<string>; busy: boolean }) {
  async function handleUpload(file: File) { const url = await onUpload(file, "events"); setDraft({ ...draft, eventImage: url }); }
  return <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="overflow-hidden rounded-xl border border-line bg-white"><div className="flex items-center justify-between border-b border-line p-5"><h2 className="font-display text-2xl font-normal">Current expo</h2><span className="text-xs text-muted">{events.length ? "1 configured" : "Not configured"}</span></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse"><thead><tr className="border-b border-slate-100 text-left text-[.65rem] uppercase tracking-[.08em] text-muted"><th className="p-4">Event</th><th className="p-4">Status</th><th className="p-4">Slots</th><th className="p-4">Actions</th></tr></thead><tbody>{events.map((event) => <tr key={event.id} className="border-b border-slate-100 text-sm last:border-0"><td className="p-4"><strong>{event.eventName}</strong><span className="mt-1 block text-xs text-muted">{event.startDate}</span></td><td className="p-4"><span className={"rounded-full px-2 py-1 text-[.62rem] font-bold uppercase " + (event.registrationOpen ? "bg-[#eaf7ed] text-success" : "bg-slate-100 text-muted")}>{event.registrationOpen ? event.status : "Unpublished"}</span></td><td className="p-4 text-xs text-muted">{event.availableSlots}/{event.maximumCapacity}</td><td className="p-4"><button type="button" className="rounded-md border border-line px-2.5 py-1.5 text-xs font-bold text-muted hover:border-rose hover:text-rose" onClick={() => onEdit(event)}>Edit</button></td></tr>)}</tbody></table>{events.length === 0 && <p className="p-10 text-center text-sm text-muted">No expo is configured.</p>}</div></section><section className="rounded-xl border border-line bg-white p-5"><h2 className="font-display text-2xl font-normal">Edit current expo</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-bold text-slate-700 sm:col-span-2">Event name<input value={draft.eventName} onChange={(e) => setDraft({ ...draft, eventName: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 sm:col-span-2">Short description<textarea value={draft.shortDescription} onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })} className={fieldClass} rows={2} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 sm:col-span-2">Full description<textarea value={draft.fullDescription} onChange={(e) => setDraft({ ...draft, fullDescription: e.target.value })} className={fieldClass} rows={3} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 sm:col-span-2">Event image<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleUpload(file); }} className="mt-1.5 w-full text-xs font-normal text-muted" />{draft.eventImage && <img src={draft.eventImage} alt="" className="mt-2 aspect-video w-full rounded-lg object-cover" />}</label><label className="grid gap-1 text-xs font-bold text-slate-700">Venue<input value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Address<input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">City<input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">State<input value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Start date<input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">End date<input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Start time<input type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">End time<input type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Fee (INR)<input type="number" min={0} value={draft.registrationPrice} onChange={(e) => setDraft({ ...draft, registrationPrice: Number(e.target.value) })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Maximum capacity<input type="number" min={0} value={draft.maximumCapacity} onChange={(e) => setDraft({ ...draft, maximumCapacity: Number(e.target.value) })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Available slots<input type="number" min={0} value={draft.availableSlots} onChange={(e) => setDraft({ ...draft, availableSlots: Number(e.target.value) })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Registration deadline<input type="datetime-local" value={draft.registrationDeadline} onChange={(e) => setDraft({ ...draft, registrationDeadline: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Status<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as EventDraft["status"] })} className={fieldClass}><option>OPEN</option><option>LIVE</option><option>COMPLETED</option><option>CLOSED</option></select></label><label className="grid gap-1 text-xs font-bold text-slate-700">Sponsor name<input value={draft.sponsorName} onChange={(e) => setDraft({ ...draft, sponsorName: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 sm:col-span-2">Sponsor logo URL<input value={draft.sponsorLogo} onChange={(e) => setDraft({ ...draft, sponsorLogo: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 sm:col-span-2">Sponsor website<input value={draft.sponsorWebsite} onChange={(e) => setDraft({ ...draft, sponsorWebsite: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 sm:col-span-2">Terms &amp; conditions<textarea value={draft.termsAndConditions} onChange={(e) => setDraft({ ...draft, termsAndConditions: e.target.value })} className={fieldClass} rows={2} /></label><label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={draft.registrationOpen} onChange={(e) => setDraft({ ...draft, registrationOpen: e.target.checked })} className="size-4 accent-rose" /> Open registration</label><label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} className="size-4 accent-rose" /> Featured event</label></div><button type="button" disabled={busy || !editingId} onClick={() => void onSave()} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button></section></div>;
}

function RegistrationsPanel({ rows, search, setSearch, onExport }: { rows: RegistrationRow[]; search: string; setSearch: (value: string) => void; onExport: () => void }) {
  return <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-display text-2xl font-normal">Registrations</h2><div className="flex gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="rounded-full border border-line bg-slate-50 px-4 py-2 text-xs outline-none focus:border-purple" /><button type="button" onClick={onExport} className="rounded-full border border-line px-4 py-2 text-xs font-bold text-muted hover:border-rose hover:text-rose">Export CSV</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[1000px] border-collapse"><thead><tr className="border-b border-slate-100 text-left text-[.65rem] uppercase tracking-[.08em] text-muted"><th className="p-4">Registration</th><th className="p-4">Visitor</th><th className="p-4">Category</th><th className="p-4">Event</th><th className="p-4">Amount</th><th className="p-4">Payment</th><th className="p-4">Date</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-slate-100 text-sm last:border-0"><td className="p-4 font-bold">{row.registrationId}</td><td className="p-4"><strong className="block">{row.visitorName}</strong><span className="text-xs text-muted">{row.phone}</span></td><td className="p-4 text-xs text-muted">{row.category}</td><td className="p-4 text-xs text-muted">{row.eventName}</td><td className="p-4">{formatINR(row.amount)}</td><td className="p-4"><span className={"rounded-full px-2 py-1 text-[.62rem] font-bold uppercase " + (row.paymentStatus === "PAID" ? "bg-[#eaf7ed] text-success" : "bg-slate-100 text-muted")}>{row.paymentStatus}</span></td><td className="p-4 text-xs text-muted">{formatDateTime(row.createdAt)}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-10 text-center text-sm text-muted">No registrations found.</p>}</div></section>;
}

function PaymentsPanel({ rows }: { rows: PaymentRow[] }) {
  return <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="border-b border-line p-5"><h2 className="font-display text-2xl font-normal">Payments</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse"><thead><tr className="border-b border-slate-100 text-left text-[.65rem] uppercase tracking-[.08em] text-muted"><th className="p-4">Registration</th><th className="p-4">Visitor</th><th className="p-4">Event</th><th className="p-4">Amount</th><th className="p-4">Razorpay order</th><th className="p-4">Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-slate-100 text-sm last:border-0"><td className="p-4 font-bold">{row.registrationId}</td><td className="p-4 text-xs">{row.visitorName}</td><td className="p-4 text-xs text-muted">{row.eventName}</td><td className="p-4">{formatINR(row.amount)}</td><td className="p-4 font-mono text-[.68rem] text-muted">{row.razorpayOrderId}</td><td className="p-4"><span className={"rounded-full px-2 py-1 text-[.62rem] font-bold uppercase " + (row.status === "PAID" ? "bg-[#eaf7ed] text-success" : "bg-slate-100 text-muted")}>{row.status}</span></td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-10 text-center text-sm text-muted">No payments found.</p>}</div></section>;
}

function SponsorsPanel({ events, onEdit }: { events: EventRecord[]; onEdit: (event: EventRecord) => void }) {
  const sponsored = events.filter((event) => event.sponsorName || event.sponsorLogo);
  return <section className="rounded-xl border border-line bg-white"><div className="border-b border-line p-5"><h2 className="font-display text-2xl font-normal">Sponsors</h2><p className="mt-1 text-xs text-muted">Sponsor details are managed on each event, with logos stored in Supabase Storage.</p></div>{sponsored.length === 0 ? <p className="p-8 text-sm text-muted">No event sponsors yet. Add one while editing an event.</p> : <div className="grid gap-3 p-5 md:grid-cols-2">{sponsored.map((event) => <div key={event.id} className="flex items-center justify-between gap-4 rounded-lg border border-line p-4"><div className="flex items-center gap-3">{event.sponsorLogo ? <img src={event.sponsorLogo} alt="" className="size-10 rounded-full border border-line object-contain" /> : <span className="grid size-10 place-items-center rounded-full bg-[#f8e9eb] font-display text-lg text-rose">{event.sponsorName?.[0]}</span>}<div><strong className="block text-sm">{event.sponsorName}</strong><span className="text-xs text-muted">{event.eventName}</span></div></div><button type="button" onClick={() => onEdit(event)} className="rounded-md border border-line px-3 py-1.5 text-xs font-bold text-muted hover:border-rose hover:text-rose">Edit</button></div>)}</div>}</section>;
}

function MessagesPanel({ rows, onRead, onDelete }: { rows: MessageRow[]; onRead: (row: MessageRow, status: "READ" | "UNREAD") => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  return <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="border-b border-line p-5"><h2 className="font-display text-2xl font-normal">Messages</h2></div><div>{rows.map((row) => <article key={row.id} className="border-b border-slate-100 p-5 last:border-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><strong className="text-sm">{row.name}</strong><span className="ml-2 text-xs text-muted">{row.email || row.phone}</span></div><span className="text-xs text-muted">{formatDateTime(row.createdAt)}</span></div><p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted">{row.message}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => void onRead(row, row.status === "READ" ? "UNREAD" : "READ")} className="rounded-md border border-line px-3 py-1.5 text-xs font-bold text-muted hover:border-rose hover:text-rose">{row.status === "READ" ? "Mark unread" : "Mark read"}</button><button type="button" onClick={() => void onDelete(row.id)} className="rounded-md border border-line px-3 py-1.5 text-xs font-bold text-muted hover:border-[#b42318] hover:text-[#b42318]">Delete</button></div></article>)}</div>{rows.length === 0 && <p className="p-10 text-center text-sm text-muted">No messages yet.</p>}</section>;
}

function SettingsPanel({ settings, setSettings, onUpload, onSave, busy, loading }: { settings: WebsiteSettings; setSettings: (settings: WebsiteSettings) => void; onUpload: (file: File, folder: string) => Promise<string>; onSave: () => void; busy: boolean; loading: boolean }) {
  async function uploadLogo(file: File) { const url = await onUpload(file, "site"); setSettings({ ...settings, siteLogo: url }); }
  async function uploadHero(file: File) { const url = await onUpload(file, "site"); setSettings({ ...settings, heroImage: url }); }
  return <section className="rounded-xl border border-line bg-white p-5 sm:p-7"><h2 className="font-display text-2xl font-normal">Website settings</h2>{loading ? <p className="mt-5 text-sm text-muted">Loading settings…</p> : <div className="mt-6 grid gap-4 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold text-slate-700">Logo<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadLogo(file); }} className="mt-1.5 text-xs font-normal text-muted" />{settings.siteLogo && <img src={settings.siteLogo} alt="" className="mt-2 h-14 w-auto object-contain" />}</label><label className="grid gap-1 text-xs font-bold text-slate-700">Hero image<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadHero(file); }} className="mt-1.5 text-xs font-normal text-muted" />{settings.heroImage && <img src={settings.heroImage} alt="" className="mt-2 aspect-video w-full rounded-lg object-cover" />}</label><label className="grid gap-1 text-xs font-bold text-slate-700 md:col-span-2">Hero heading<input value={settings.heroHeading} onChange={(e) => setSettings({ ...settings, heroHeading: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 md:col-span-2">Hero description<textarea value={settings.heroDescription} onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })} className={fieldClass} rows={2} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 md:col-span-2">About text<textarea value={settings.aboutText} onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })} className={fieldClass} rows={4} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 md:col-span-2">Address<textarea value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className={fieldClass} rows={2} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Google Maps URL<input value={settings.googleMapsUrl} onChange={(e) => setSettings({ ...settings, googleMapsUrl: e.target.value })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Default fee (INR)<input type="number" value={settings.defaultRegistrationPrice} onChange={(e) => setSettings({ ...settings, defaultRegistrationPrice: Number(e.target.value) })} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700 md:col-span-2">Footer text<input value={settings.footerText} onChange={(e) => setSettings({ ...settings, footerText: e.target.value })} className={fieldClass} /></label>{settings.contactNumbers.map((person, index) => <div key={index} className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-2 md:col-span-2"><label className="grid gap-1 text-xs font-bold text-slate-700">Contact name<input value={person.name} onChange={(e) => { const contactNumbers = [...settings.contactNumbers]; contactNumbers[index] = { ...contactNumbers[index], name: e.target.value }; setSettings({ ...settings, contactNumbers }); }} className={fieldClass} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Phone<input value={person.phone} onChange={(e) => { const contactNumbers = [...settings.contactNumbers]; contactNumbers[index] = { ...contactNumbers[index], phone: e.target.value }; setSettings({ ...settings, contactNumbers }); }} className={fieldClass} /></label></div>)}</div>}<button type="button" disabled={busy || loading} onClick={() => void onSave()} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60">{busy ? "Saving…" : "Save website settings"}</button></section>;
}
