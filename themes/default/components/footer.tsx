export function ThemeFooter({ text }: { text?: string }) {
  return (
    <footer className="border-t bg-gray-50 py-6 text-center text-sm text-gray-400">
      {text ?? "Powered by NextPress"}
    </footer>
  );
}
