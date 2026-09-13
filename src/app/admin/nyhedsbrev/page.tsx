import { createAdminClient } from "@/lib/supabase/admin";
import { NewsletterForm } from "./NewsletterForm";

// Antal tilmeldte/frameldte skal altid være friskt - må ikke caches.
export const dynamic = "force-dynamic";
// Sender én mail ad gangen til alle tilmeldte - giver lidt ekstra tid, hvis
// listen en dag bliver stor (samme grund som cron/tip-reminder).
export const maxDuration = 60;

export default async function AdminNyhedsbrevPage() {
  const admin = createAdminClient();

  const [{ count: totalCount }, { count: optedOutCount }] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("newsletter_opt_out", true),
  ]);

  const recipientCount = (totalCount ?? 0) - (optedOutCount ?? 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-8 w-8" />
            <h1 className="text-2xl font-extrabold">Nyhedsbrev</h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Sender en mail fra info@ugenstipper.dk til alle brugere, der ikke har frameldt
            nyhedsbrevet - med et afmeld-link sat automatisk ind nederst i hver mail.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-right">
          <a href="/admin/kampe" className="text-sm font-semibold text-accent">
            ← Kampe
          </a>
          <a href="/admin/bannere" className="text-sm font-semibold text-accent">
            Bannere →
          </a>
          <a href="/tip" className="text-sm font-semibold text-text-muted">
            Tilbage til Ugenstipper
          </a>
        </div>
      </div>

      <p className="mt-4 text-sm">
        <span className="font-bold text-accent">{recipientCount}</span> af {totalCount ?? 0}{" "}
        brugere modtager nyhedsbrevet lige nu
        {optedOutCount ? ` (${optedOutCount} har frameldt)` : ""}.
      </p>

      <NewsletterForm />
    </div>
  );
}
