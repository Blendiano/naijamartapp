export const authFormStyles = {
  inputWrap: "relative",
  form: "flex flex-col gap-5",
  field: "flex flex-col gap-1.5 text-sm",
  label:
    "font-semibold text-[length:var(--sys-font-size-sm)] text-foreground",
  input:
    "h-12 w-full px-3.5 rounded-xl border border-input bg-background text-[length:var(--sys-font-size-base)] text-foreground placeholder:text-[length:var(--sys-font-size-sm)] placeholder:text-muted-foreground/70 hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary transition-colors",
  inputWithToggle:
    "h-12 w-full px-3.5 pr-11 rounded-xl border border-input bg-background text-[length:var(--sys-font-size-base)] text-foreground placeholder:text-[length:var(--sys-font-size-sm)] placeholder:text-muted-foreground/70 hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary transition-colors",
  toggle:
    "absolute top-1/2 -translate-y-1/2 right-1 flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
  alert:
    "px-3.5 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium",
  submit: "w-full",
  footer: "pt-1 text-center text-base text-muted-foreground",
  footerLink:
    "cursor-pointer font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
} as const;