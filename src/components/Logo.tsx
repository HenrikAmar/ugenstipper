// Selve badge-ikonet, brugt alene (fx i src/app/error.tsx) eller sammen med
// "Ugenstipper"-teksten (se Logo() nedenfor). Bruger det rigtige logo-billede
// (public/logo.png) i stedet for en håndtegnet kopi af det - ellers skal
// denne tegning huskes opdateret manuelt, hver gang selve logoet ændres (det
// skete netop her: en tidligere håndtegnet udgave viste stadig den gamle,
// firkantede badge-form efter selve logoet var rettet til den runde).
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="block shrink-0"
    />
  );
}

export function Logo({
  size = 36,
  textClassName = "text-white",
}: {
  size?: number;
  textClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className={`font-heading text-[19px] font-extrabold tracking-tight ${textClassName}`}>
        Ugenstipper
      </span>
    </div>
  );
}
