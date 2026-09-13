import { createAdminClient } from "@/lib/supabase/admin";

// Skal altid tjekke friskt, om token'et er gyldigt - må ikke caches.
export const dynamic = "force-dynamic";

// Offentlig side (se src/middleware.ts) - man skal netop kunne afmelde
// nyhedsbrevet uden at logge ind først. Bruger admin-klienten, fordi
// opslaget sker på "unsubscribe_token", ikke en indlogget brugers eget id.
export default async function AfmeldNyhedsbrevPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  let success = false;

  if (token) {
    const admin = createAdminClient();
    const { error, count } = await admin
      .from("profiles")
      .update({ newsletter_opt_out: true })
      .eq("unsubscribe_token", token)
      .select("id", { count: "exact" });
    success = !error && (count ?? 0) > 0;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Ugenstipper.dk" className="mb-4 h-16 w-16" />
      {success ? (
        <>
          <h1 className="text-lg font-bold">Du er nu afmeldt</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-text-muted">
            Du modtager ikke flere nyhedsbreve fra Ugenstipper.dk. Du kan altid tilmelde dig
            igen på din profilside, hvis du fortryder.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-lg font-bold">Kunne ikke afmelde</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-text-muted">
            Linket ser ud til at være ugyldigt. Du kan i stedet afmelde nyhedsbrevet fra din
            profilside, når du er logget ind.
          </p>
        </>
      )}
      <a
        href="/tip"
        className="mt-6 flex h-11 items-center justify-center rounded-[10px] border border-border px-6 text-sm font-bold"
      >
        Tilbage til Ugenstipper
      </a>
    </div>
  );
}
