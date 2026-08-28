"use client";

import { useRouter } from "next/navigation";

// Lille dropdown til at vælge sæson på Stilling-siden. Bruger kun useRouter
// (ikke useSearchParams), så den ikke kræver en Suspense-boundary at virke.
export function SeasonSelect({
  basePath,
  paramName,
  value,
  options,
  currentParams,
}: {
  basePath: string;
  paramName: string;
  value: string;
  options: string[];
  currentParams: Record<string, string | undefined>;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    for (const key of Object.keys(currentParams)) {
      const val = currentParams[key];
      if (val) params.set(key, val);
    }
    params.set(paramName, e.target.value);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="h-9 rounded-lg border border-border bg-surface px-2.5 text-[13px] font-semibold"
    >
      {options.map((season) => (
        <option key={season} value={season}>
          {season}
        </option>
      ))}
    </select>
  );
}