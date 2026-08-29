import { createFileRoute } from "@tanstack/react-router";
import { Download, ExternalLink, LogIn, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listAdminRegistrations } from "@/lib/registration.functions";
import { WhatsAppIcon } from "@/components/tdc/event";

export const Route = createFileRoute("/leadstdc")({ component: TdcLeadsPage });
type Lead = any;

const whatsappUrl = (number: string) => "https://wa.me/" + number.replace(/\D/g, "").replace(/^0/, "92");
const statusOptions = ["All", "Opted In", "Checkout Started", "Payment Submitted", "Payment Pending", "Payment Verified", "Registered", "Abandoned Checkout"];

function TdcLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [leadStatus, setLeadStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [proof, setProof] = useState<Lead | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError(null);
    try { setLeads(await listAdminRegistrations({ data: { query: query || undefined } })); }
    catch { setError("Sign in with a Supabase administrator account to view these private leads."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => leads.filter((lead) =>
    (leadStatus === "All" || lead.lead_status === leadStatus) &&
    (paymentStatus === "All" || lead.payment_status === paymentStatus)
  ), [leads, leadStatus, paymentStatus]);
  const totals = useMemo(() => ({
    total: leads.length,
    submitted: leads.filter((x) => x.payment_status === "Payment Submitted").length,
    pending: leads.filter((x) => x.payment_status === "Payment Pending").length,
    registered: leads.filter((x) => x.registration_status === "Registered" || x.lead_status === "Registered").length,
  }), [leads]);
  const exportCsv = () => {
    const header = ["Lead/Registration ID","Name","WhatsApp","Email","City","Age","Diabetes Status","Diabetes Type","Lead Status","Payment Status","Amount","Registration Date/Time","Payment Submission Date/Time"];
    const q = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = [header, ...filtered.map((x) => [x.id,x.full_name,x.whatsapp,x.email,x.city,x.age,x.has_diabetes,x.diabetes_type,x.lead_status,x.payment_status,x.amount_pkr,x.created_at,x.payment_submitted_at])].map((r) => r.map(q).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"})); a.download = "diabetes-control-masterclass-leads.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); return; }
    await load();
  };

  if (error && leads.length === 0) return <main className="min-h-screen bg-tint p-6"><div className="mx-auto max-w-md rounded-3xl bg-card p-7 shadow-card"><h1 className="text-2xl font-extrabold text-navy">TDC Leads</h1><p className="mt-2 text-sm text-muted-foreground">This private view requires a Supabase Auth administrator account.</p><form className="mt-6 space-y-3" onSubmit={login}><input className="w-full rounded-xl border p-3" required type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/><input className="w-full rounded-xl border p-3" required type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}/><button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-3 font-bold text-primary-foreground"><LogIn className="h-4 w-4"/>Sign in</button></form><p className="mt-3 text-sm text-destructive">{error}</p></div></main>;

  return <main className="min-h-screen bg-tint p-4 sm:p-8"><div className="mx-auto max-w-[1440px]"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-brand">The Diabetes Centre Pakistan</p><h1 className="text-3xl font-extrabold text-navy">Diabetes Control Masterclass — Leads</h1><p className="mt-1 text-sm text-muted-foreground">View registrations, submitted answers, payment status and payment screenshots.</p></div><button onClick={exportCsv} disabled={!filtered.length} className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-3 font-bold text-primary-foreground disabled:opacity-50"><Download className="h-4 w-4"/>Export CSV</button></header><section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Total Leads",totals.total],["Payment Submitted",totals.submitted],["Payment Pending",totals.pending],["Registered",totals.registered]].map(([label,count])=><div key={String(label)} className="rounded-2xl bg-card p-5 shadow-card"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-extrabold text-navy">{count}</p></div>)}</section><form className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]" onSubmit={(e)=>{e.preventDefault();void load();}}><div className="flex rounded-2xl border bg-card"><input className="min-h-12 flex-1 rounded-l-2xl px-4 outline-none" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search name, WhatsApp or email"/><button className="px-4 text-brand"><Search className="h-5 w-5"/></button></div><select className="rounded-2xl border bg-card px-3" value={leadStatus} onChange={(e)=>setLeadStatus(e.target.value)}>{statusOptions.map((x)=><option key={x}>{x}</option>)}</select><select className="rounded-2xl border bg-card px-3" value={paymentStatus} onChange={(e)=>setPaymentStatus(e.target.value)}>{statusOptions.map((x)=><option key={x}>{x}</option>)}</select><button className="rounded-2xl bg-navy px-5 py-3 font-bold text-white">Apply</button></form>{error?<p className="mt-3 text-sm text-destructive">{error}</p>:null}<div className="mt-6 overflow-x-auto rounded-3xl bg-card shadow-card"><table className="min-w-[1300px] w-full text-left text-sm"><thead className="border-b bg-tint text-navy"><tr>{["Date / Time","Full Name","WhatsApp","Email","City","Age","Diabetes Status","Diabetes Type","Lead Status","Payment Status","Amount","Payment Screenshot","Actions"].map((x)=><th className="p-3 font-bold" key={x}>{x}</th>)}</tr></thead><tbody>{loading?<tr><td colSpan={13} className="p-6">Loading leads…</td></tr>:filtered.map((lead)=><tr className="border-b last:border-0" key={lead.id}><td className="p-3 whitespace-nowrap">{new Date(lead.created_at).toLocaleString()}</td><td className="p-3 font-semibold">{lead.full_name}</td><td className="p-3">{lead.whatsapp}</td><td className="p-3">{lead.email}</td><td className="p-3">{lead.city}</td><td className="p-3">{lead.age??"—"}</td><td className="p-3">{lead.has_diabetes??"—"}</td><td className="p-3">{lead.diabetes_type??"—"}</td><td className="p-3">{lead.lead_status}</td><td className="p-3">{lead.payment_status}</td><td className="p-3">PKR {lead.amount_pkr}</td><td className="p-3">{lead.proofUrl?<button className="inline-flex items-center gap-1 rounded-full border border-brand/30 px-3 py-1.5 text-xs font-bold text-brand" onClick={()=>setProof(lead)}><ExternalLink className="h-3.5 w-3.5"/>View Screenshot</button>:<span className="text-xs text-muted-foreground">No Screenshot</span>}</td><td className="p-3"><div className="flex gap-2"><button className="rounded-full border px-3 py-1.5 text-xs font-bold text-navy" onClick={()=>setSelected(lead)}>View Details</button><a className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-primary-foreground" target="_blank" rel="noreferrer" href={whatsappUrl(lead.whatsapp)}><WhatsAppIcon className="h-4 w-4"/>WhatsApp</a></div></td></tr>)}</tbody></table></div></div>{selected?<Details lead={selected} close={()=>setSelected(null)}/>:null}{proof?<Proof lead={proof} close={()=>setProof(null)}/>:null}</main>;
}
function Overlay({children,close}:{children:React.ReactNode;close:()=>void}){return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-4"><div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-card p-6 shadow-2xl"><button onClick={close} className="absolute right-4 top-4 rounded-full p-2 text-navy"><X className="h-5 w-5"/></button>{children}</div></div>}
function Details({lead,close}:{lead:Lead;close:()=>void}){const fields=[["Full Name",lead.full_name],["WhatsApp Number",lead.whatsapp],["Email",lead.email],["City",lead.city],["Age",lead.age],["Diabetes Status",lead.has_diabetes],["Diabetes Type",lead.diabetes_type],["Lead/Registration ID",lead.id],["Lead Status",lead.lead_status],["Payment Status",lead.payment_status],["Registration Date/Time",new Date(lead.created_at).toLocaleString()],["Payment Submission Date/Time",lead.payment_submitted_at?new Date(lead.payment_submitted_at).toLocaleString():"—"]];return <Overlay close={close}><h2 className="text-2xl font-extrabold text-navy">Lead details</h2><dl className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map(([label,value])=><div key={label} className="rounded-2xl bg-tint p-3"><dt className="text-xs font-bold uppercase text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-semibold text-navy">{value??"—"}</dd></div>)}</dl></Overlay>}
function Proof({lead,close}:{lead:Lead;close:()=>void}){const pdf=lead.payment_proof_path?.toLowerCase().endsWith(".pdf");return <Overlay close={close}><h2 className="text-2xl font-extrabold text-navy">Payment screenshot</h2><p className="mt-1 text-sm text-muted-foreground">{lead.full_name} · {lead.id}</p>{pdf?<iframe title="Payment proof" src={lead.proofUrl} className="mt-5 h-[65vh] w-full rounded-xl border"/>:<img src={lead.proofUrl} alt={"Payment proof for "+lead.full_name} className="mt-5 max-h-[65vh] w-full rounded-xl object-contain"/>}<a href={lead.proofUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-brand px-4 py-2 text-sm font-bold text-primary-foreground">Open secure view</a></Overlay>}
