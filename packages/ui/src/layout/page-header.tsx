interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="np-page-header mb-6">
      {breadcrumbs && (
        <nav className="mb-2 text-sm text-gray-400">
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1">/</span>}
              {b.href ? <a href={b.href} className="hover:text-gray-600">{b.label}</a> : b.label}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
