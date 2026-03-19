interface Props {
  text?: string;
}

export function ThemeFooter({ text }: Props) {
  const year = new Date().getFullYear();
  return (
    <footer className="np-footer">
      <div className="np-container">
        <div className="np-footer-grid">
          <div>
            <h3 className="np-widget-title">About</h3>
            <p className="text-sm" style={{ color: "var(--np-text-secondary)" }}>
              A modern website powered by NextPress — the WordPress alternative built on Next.js.
            </p>
          </div>
          <div>
            <h3 className="np-widget-title">Navigate</h3>
            <nav className="flex flex-col gap-1">
              <a href="/" className="text-sm" style={{ color: "var(--np-text-secondary)", textDecoration: "none" }}>Home</a>
              <a href="/blog" className="text-sm" style={{ color: "var(--np-text-secondary)", textDecoration: "none" }}>Blog</a>
              <a href="/about" className="text-sm" style={{ color: "var(--np-text-secondary)", textDecoration: "none" }}>About</a>
            </nav>
          </div>
          <div>
            <h3 className="np-widget-title">Subscribe</h3>
            <p className="text-sm" style={{ color: "var(--np-text-secondary)" }}>
              Get the latest posts delivered to your inbox.
            </p>
            <a href="/feed.xml" className="np-read-more">RSS Feed →</a>
          </div>
        </div>
        <div className="np-footer-bottom">
          © {year} · {text ?? "Powered by NextPress"}
        </div>
      </div>
    </footer>
  );
}
