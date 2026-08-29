import { createFileRoute } from "@tanstack/react-router";
import { Download, ExternalLink, LogIn, MessageCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listAdminRegistrations } from "@/lib/registration.functions";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Row = Awaited<ReturnType<typeof listAdminRegistrations>>[number];

function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (search = "") => {
    setLoading(true); setError(null);
    try { setRows(await listAdminRegistrations({ data: { query: search || undefined } })); }
    catch { setError("You must sign in with an administrator account to view registrations."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const exportCsv = () => {
    const header = ["Lead/Registration ID","Name","WhatsApp","Email","City","Age","Diabetes Status","Diabetes Type","Lead Status","Payment Status","Submission Date","Payment Submission Date"];
    const quote = (value: unknown) => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const csv = [header, ...rows.map((r) => [r.id,r.full_name,r.whatsapp,r.email,r.city,r.age,r.has_diabetes,r.diabetes_type,r.lead_status,r.payment_status,r.created_at,r.payment_submitted_at])].map((r) => r.map(quote).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "tdc-masterclass-leads.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); return; }
    await load();
  };

  if (error && rows.length === 0) return <main className="min-h-screen bg-tint p-6"><div className="mx-auto max-w-md rounded-3xl bg-card p-7 shadow-card"><h1 className="text-2xl font-extrabold text-navy">TDC Lead Admin</h1><p className="mt-2 text-sm text-muted-foreground">Sign in with a Supabase Auth account that has <code>app_metadata.role = admin</code>.</p><form onSubmit={login} className="mt-6 space-y-3"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border p-3" /><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border p-3" /><button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-3 font-bold text-primary-foreground"><LogIn className="h-4 w-4" /> Sign in</button></form><p className="mt-3 text-sm text-destructive">{error}</p></div></main>;

  return <main className="min-h-screen bg-tint p-5 sm:p-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-brand">The Diabetes Centre Pakistan</p><h1 className="text-3xl font-extrabold text-navy">Captured leads</h1></div><button onClick={exportCsv} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-3 font-bold text-primary-foreground disabled:opacity-50"><Download className="h-4 w-4" /> Export CSV</button></div><form onSubmit={(e) => { e.preventDefault(); void load(query); }} className="mt-6 flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, WhatsApp or email" className="min-h-12 flex-1 rounded-2xl border bg-card px-4" /><button className="rounded-2xl bg-navy px-4 text-white"><Search className="h-5 w-5" /></button></form>{error ? <p className="mt-4 text-destructive">{error}</p> : null}<div className="mt-6 overflow-x-auto rounded-3xl bg-card shadow-card"><table className="min-w-full text-left text-sm"><thead className="border-b text-navy"><tr>{["Name","WhatsApp","Email","City","Diabetes status","Type","Lead status","Payment","Date","Actions"].map((h) => <th key={h} className="p-4 font-bold">{h}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={10} className="p-6">Loading…</td></tr> : rows.map((r) => <tr key={r.id} className="border-b last:border-0"><td className="p-4 font-semibold">{r.full_name}</td><td className="p-4">{r.whatsapp}</td><td className="p-4">{r.email}</td><td className="p-4">{r.city}</td><td className="p-4">{r.has_diabetes ?? "—"}</td><td className="p-4">{r.diabetes_type ?? "—"}</td><td className="p-4">{r.lead_status}</td><td className="p-4">{r.payment_status}</td><td className="p-4">{new Date(r.created_at).toLocaleString()}</td><td className="p-4"><div className="flex gap-2">{r.proofUrl ? <a href={r.proofUrl} target="_blank" rel="noreferrer" className="text-brand"><ExternalLink className="h-4 w-4" /></a> : null}<a href={"https://wa.me/" + r.whatsapp.replace(/\D/g, "").replace(/^0/, "92")} target="_blank" rel="noreferrer" className="text-brand"><MessageCircle className="h-4 w-4" /></a></div></td></tr>)}</tbody></table></div></div></main>;
}
