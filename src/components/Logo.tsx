import { useId } from "react";

export function LogoMark({ size = 40 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16233D" />
          <stop offset="1" stopColor="#17A673" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${gradientId})`} />
      <path
        d="M19 33.5L28 42.5L46 22.5"
        stroke="#FFFFFF"
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
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
