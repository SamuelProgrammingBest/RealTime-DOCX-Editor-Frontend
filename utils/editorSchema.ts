import {
  BlockNoteSchema,
  createStyleSpec,
  defaultStyleSpecs,
} from "@blocknote/core";

export const editorSchema = BlockNoteSchema.create({
  styleSpecs: {
    ...defaultStyleSpecs,
    fontSize: createStyleSpec(
      { type: "fontSize", propSchema: "string" },
      {
        render: (value) => {
          const span = document.createElement("span");
          span.style.fontSize = value;
          return { dom: span, contentDOM: span };
        },
        toExternalHTML: (value) => {
          const span = document.createElement("span");
          span.style.fontSize = value;
          return { dom: span, contentDOM: span };
        },
        parse: (element) => element.style.fontSize || undefined,
      },
    ),
  },
});
