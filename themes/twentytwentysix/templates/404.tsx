import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function NotFoundTemplate({ context }: TemplateProps) {
  return (
    <div className="np-404">
      <div className="np-404-code">404</div>
      <h1 className="np-404-title">Page not found</h1>
      <p className="np-404-desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a href="/" className="np-404-link">Back to Home</a>
    </div>
  );
}
