interface Props {
  siteName?: string;
}

export function ThemeHeader({ siteName }: Props) {
  return (
    <header className="np-header">
      <div className="np-container np-header-inner">
        <a href="/" className="np-site-title">{siteName ?? "NextPress"}</a>
        <nav className="np-nav flex items-center gap-1">
          <a href="/">Home</a>
          <a href="/blog">Blog</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}
