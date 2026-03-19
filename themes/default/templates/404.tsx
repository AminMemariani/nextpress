import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function NotFoundTemplate({ context }: TemplateProps) {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <p className="mt-4 text-xl text-gray-600">Page not found</p>
      <a href="/" className="mt-6 inline-block text-blue-600 hover:underline">Go home</a>
    </div>
  );
}
