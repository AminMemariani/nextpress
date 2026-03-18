import { registerEditorBlock } from "../../core/block-registry";
import { columnsSchema } from "@nextpress/blocks/blocks/columns";
import { ColumnsEdit } from "./edit";

registerEditorBlock({
  type: "core/columns",
  title: "Columns",
  icon: "columns",
  category: "layout",
  attributesSchema: columnsSchema,
  defaultAttributes: { columns: 2, gap: "md", verticalAlign: "top" },
  version: 1,
  allowsInnerBlocks: true,
  source: "core",
  renderComponent: null,
  editComponent: ColumnsEdit,
});
