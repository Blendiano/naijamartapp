interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="text-xs font-medium text-destructive mt-1" role="alert">
      {message}
    </p>
  );
}