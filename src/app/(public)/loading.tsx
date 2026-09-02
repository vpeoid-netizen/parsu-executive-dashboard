export default function PublicLoading() {
  return (
    <div className="page-shell animate-pulse">
      <div className="mb-6 h-8 w-56 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="card h-40" />
        ))}
      </div>
    </div>
  );
}
