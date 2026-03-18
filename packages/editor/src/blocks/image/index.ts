import { registerEditorBlock } from "../../core/block-registry";
import { imageSchema } from "@nextpress/blocks/blocks/image";
import { ImageEdit } from "./edit";

registerEditorBlock({
  type: "core/image",
  title: "Image",
  icon: "image",
  category: "media",
  attributesSchema: imageSchema,
  defaultAttributes: { url: "", alt: "", align: "center" },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: null,
  editComponent: ImageEdit,
});
