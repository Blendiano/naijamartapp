export const authFormStyles = {
  form: "flex flex-col gap-5",
  field: "flex flex-col gap-1.5 text-sm",
  fieldHeader: "flex items-center justify-between",
  label: "font-semibold text-xs text-foreground",
  input:
    "h-12 w-full px-3.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/70 hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary transition-colors",
  error: "text-xs font-medium text-destructive mt-1",
  alert:
    "px-3.5 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium",
  submit:
    "h-12 w-full rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none transition-all shadow-xs",
  footer: "pt-1 text-center text-base text-muted-foreground",
  footerLink:
    "cursor-pointer font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
} as const;