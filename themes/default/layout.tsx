import { ThemeHeader } from "./components/header";
import { ThemeFooter } from "./components/footer";

interface Props {
  children: React.ReactNode;
  customizations: Record<string, unknown>;
}

export default function ThemeLayout({ children, customizations }: Props) {
  const fontClass = customizations.fontFamily === "serif"
    ? "font-serif"
    : customizations.fontFamily === "mono"
    ? "font-mono"
    : "font-sans";

  return (
    <div className={`np-theme-default ${fontClass} min-h-screen flex flex-col`}>
      <ThemeHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>
      <ThemeFooter text={customizations.footerText as string} />
    </div>
  );
}
