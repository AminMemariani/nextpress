import { registerEditorBlock } from "../../core/block-registry";
import { buttonSchema } from "@nextpress/blocks/blocks/button";
import { ButtonEdit } from "./edit";

registerEditorBlock({
  type: "core/button",
  title: "Button / CTA",
  icon: "mouse-pointer-click",
  category: "widgets",
  attributesSchema: buttonSchema,
  defaultAttributes: { text: "Click here", url: "#", variant: "primary", size: "md", openInNewTab: false, align: "left" },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: null,
  editComponent: ButtonEdit,
});
