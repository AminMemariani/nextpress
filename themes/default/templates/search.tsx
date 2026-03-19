import type { TemplateProps } from "@nextpress/core/theme/theme-types";
import ArchiveTemplate from "./archive";

export default function SearchTemplate(props: TemplateProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Search results for: "{props.context.searchQuery}"
      </h1>
      <ArchiveTemplate {...props} />
    </div>
  );
}
