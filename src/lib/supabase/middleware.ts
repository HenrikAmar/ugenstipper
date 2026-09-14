import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // VIGTIGT: getUser() kaldes for at forny access-tokenet - fjern den ikke.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bruges til aldersverificerings-gaten i src/middleware.ts - slår op om
  // brugeren mangler at udfylde sin fødselsdato (se supabase/alder.sql).
  // Fejler opslaget (fx en midlertidig fejl), antager vi at den IKKE
  // mangler, så folk ikke bliver låst ude på grund af en fejl der ikke er
  // deres.
  let needsBirthDate = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("birth_date")
      .eq("id", user.id)
      .maybeSingle();
    needsBirthDate = profile !== null && profile.birth_date === null;
  }

  return { supabaseResponse, user, needsBirthDate };
}
