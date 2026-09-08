export function AdminModuleIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </header>
  );
}
