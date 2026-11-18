/** Immatriculation dessinée comme une plaque française (bandes bleues, lettre F). */
export function Plate({ value, className = '' }: { value?: string | null; className?: string }) {
  if (!value) return <span className={`inline-flex rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 ${className}`}>Sans plaque</span>
  return (
    <span className={`inline-flex items-stretch overflow-hidden rounded-[4px] border border-slate-400 bg-white text-xs leading-none shadow-sm ${className}`} aria-label={`Immatriculation ${value}`}>
      <span aria-hidden className="flex w-3 flex-col items-center justify-end bg-[#003399] pb-0.5 text-[7px] font-bold text-white">
        F
      </span>
      <span className="px-1.5 py-1 font-mono font-black tracking-wider text-slate-900">{value}</span>
      <span aria-hidden className="w-3 bg-[#003399]" />
    </span>
  )
}
