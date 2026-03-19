interface Props {
  children: React.ReactNode;
  customizations: Record<string, unknown>;
}

export default function ThemeLayout({ children }: Props) {
  return (
    <div className="min-h-screen">
      <header className="border-b p-4"><a href="/" className="font-bold">My Site</a></header>
      <main className="max-w-4xl mx-auto p-4">{children}</main>
      <footer className="border-t p-4 text-center text-sm text-gray-400">My Site</footer>
    </div>
  );
}
