export function ThemeHeader() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-gray-900">NextPress</a>
        <nav className="flex gap-4 text-sm text-gray-600">
          <a href="/" className="hover:text-gray-900">Home</a>
          <a href="/blog" className="hover:text-gray-900">Blog</a>
        </nav>
      </div>
    </header>
  );
}
