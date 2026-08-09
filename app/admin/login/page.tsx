"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteLogo } from "@/components/site/site-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/admin");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-cream p-6">
    <form className="w-full max-w-[430px] rounded-[20px] border border-line bg-white p-8 sm:p-9" onSubmit={submit}>
      <SiteLogo compact />
      <h1 className="mt-7 font-display text-4xl font-normal leading-none tracking-[-.035em]">Welcome back.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Sign in to manage expos, registrations, messages, and the Soft Shine website.</p>
      <label className="mt-7 grid gap-1.5 text-xs font-bold text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-purple focus:bg-white focus:ring-4 focus:ring-purple/10" autoComplete="email" /></label>
      <label className="mt-4 grid gap-1.5 text-xs font-bold text-slate-700">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-purple focus:bg-white focus:ring-4 focus:ring-purple/10" autoComplete="current-password" /></label>
      {error && <p className="mt-4 text-xs leading-5 text-[#b42318]" role="alert">{error}</p>}
      <button type="submit" disabled={loading} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
      <Link href="/" className="mt-4 block text-center text-xs font-semibold text-muted hover:text-rose">Back to website</Link>
    </form>
  </main>;
}
