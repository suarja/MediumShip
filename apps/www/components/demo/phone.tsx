import type { CSSProperties, PropsWithChildren } from "react";

type PhoneProps = PropsWithChildren<{
  large?: boolean;
  label?: string;
}>;

export function Phone({ children, large = false, label }: PhoneProps) {
  return (
    <div
      className={`phone ${large ? "phone--lg" : ""}`}
      aria-label={label ?? "iPhone mockup"}
    >
      <div className="phone__notch" />
      <div className="phone__home" />
      <div className="phone__screen">{children}</div>
    </div>
  );
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const style: CSSProperties | undefined = dark ? { color: "#F3EFE6" } : undefined;
  return (
    <div className="phone__statusbar" style={style}>
      <span>9:41</span>
      <span className="phone__sb-r">
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <path
            d="M1 6.5a3 3 0 0 1 5 0M0 4a6 6 0 0 1 8 0M0 1.5a9 9 0 0 1 11 0"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
          <rect x="1" y="1" width="17" height="9" rx="2" stroke="currentColor" />
          <rect x="3" y="3" width="13" height="5" rx="1" fill="currentColor" />
          <rect x="19" y="4" width="2" height="3" rx="1" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}
