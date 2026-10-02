export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div
        className="h-10 w-10 rounded-full border-2 border-border border-t-primary animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}