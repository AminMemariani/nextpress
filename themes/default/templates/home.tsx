import type { TemplateProps } from "@nextpress/core/theme/theme-types";
import ArchiveTemplate from "./archive";

export default function HomeTemplate(props: TemplateProps) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{props.context.site.name}</h1>
        {props.context.site.tagline && (
          <p className="mt-1 text-lg text-gray-500">{props.context.site.tagline}</p>
        )}
      </div>
      <ArchiveTemplate {...props} />
    </div>
  );
}
