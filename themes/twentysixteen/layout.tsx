import { ThemeHeader } from "./components/header";
import { ThemeFooter } from "./components/footer";
import "./styles/theme.css";

interface Props {
  children: React.ReactNode;
  customizations: Record<string, unknown>;
}

export default function ThemeLayout({ children, customizations }: Props) {
  const font = customizations.fontFamily as string ?? "system";
  const dark = customizations.darkMode as boolean ?? false;

  return (
    <div className={`np-2026 np-font-${font} ${dark ? "np-dark" : ""} min-h-screen flex flex-col`}>
      <ThemeHeader siteName={customizations.siteName as string} />
      <div className="np-container flex-1">
        {children}
      </div>
      <ThemeFooter text={customizations.footerText as string} />
    </div>
  );
}
