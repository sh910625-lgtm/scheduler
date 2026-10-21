/** Material Symbols 아이콘 (Stitch 디자인과 동일한 아이콘 세트) */
export function Icon({ name, filled, className = "" }: { name: string; filled?: boolean; className?: string }) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${filled ? "filled" : ""} ${className}`}>
      {name}
    </span>
  );
}
