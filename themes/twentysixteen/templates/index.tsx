import HomeTemplate from "./home";
import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function IndexTemplate(props: TemplateProps) {
  return <HomeTemplate {...props} />;
}
