import { describe, it, expect } from "vitest";
import { convertProseMirrorToMarkdown } from "../docmost/markdown.js";

const doc = (content: unknown[]) => ({ type: "doc", content });
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const text = (t: string, ...marks: unknown[]) => ({ type: "text", text: t, marks });
const mark = (type: string, attrs?: Record<string, unknown>) => ({ type, attrs });

describe("convertProseMirrorToMarkdown", () => {
  it("returns empty string for empty doc", () => {
    expect(convertProseMirrorToMarkdown({ type: "doc", content: [] })).toBe("");
  });

  it("converts plain paragraph", () => {
    expect(convertProseMirrorToMarkdown(doc([p(text("hello"))]))).toBe("hello");
  });

  it("converts bold", () => {
    expect(convertProseMirrorToMarkdown(doc([p(text("hi", mark("bold")))]))).toBe("**hi**");
  });

  it("converts italic", () => {
    expect(convertProseMirrorToMarkdown(doc([p(text("hi", mark("italic")))]))).toBe("*hi*");
  });

  it("converts inline code", () => {
    expect(convertProseMirrorToMarkdown(doc([p(text("x", mark("code")))]))).toBe("`x`");
  });

  it("converts strikethrough", () => {
    expect(convertProseMirrorToMarkdown(doc([p(text("x", mark("strike")))]))).toBe("~~x~~");
  });

  it("converts link", () => {
    const result = convertProseMirrorToMarkdown(doc([p(text("click", mark("link", { href: "https://example.com" })))]));
    expect(result).toBe("[click](https://example.com)");
  });

  it("converts heading", () => {
    const h2 = { type: "heading", attrs: { level: 2 }, content: [text("Title")] };
    expect(convertProseMirrorToMarkdown(doc([h2]))).toBe("## Title");
  });

  it("converts code block", () => {
    const block = { type: "codeBlock", attrs: { language: "ts" }, content: [text("const x = 1")] };
    expect(convertProseMirrorToMarkdown(doc([block]))).toBe("```ts\nconst x = 1\n```");
  });

  it("converts bullet list", () => {
    const list = {
      type: "bulletList",
      content: [
        { type: "listItem", content: [p(text("a"))] },
        { type: "listItem", content: [p(text("b"))] },
      ],
    };
    expect(convertProseMirrorToMarkdown(doc([list]))).toBe("- a\n- b");
  });

  it("converts ordered list", () => {
    const list = {
      type: "orderedList",
      content: [
        { type: "listItem", content: [p(text("first"))] },
        { type: "listItem", content: [p(text("second"))] },
      ],
    };
    expect(convertProseMirrorToMarkdown(doc([list]))).toBe("1. first\n2. second");
  });

  it("converts task list", () => {
    const list = {
      type: "taskList",
      content: [
        { type: "taskItem", attrs: { checked: true }, content: [p(text("done"))] },
        { type: "taskItem", attrs: { checked: false }, content: [p(text("todo"))] },
      ],
    };
    const result = convertProseMirrorToMarkdown(doc([list]));
    expect(result).toBe("- [x] done\n- [ ] todo");
  });

  it("converts blockquote", () => {
    const bq = { type: "blockquote", content: [p(text("quoted"))] };
    expect(convertProseMirrorToMarkdown(doc([bq]))).toBe("> quoted");
  });

  it("converts horizontal rule", () => {
    expect(convertProseMirrorToMarkdown(doc([{ type: "horizontalRule" }]))).toBe("---");
  });

  it("converts image", () => {
    const img = { type: "image", attrs: { src: "https://img.com/a.png", alt: "alt text" } };
    expect(convertProseMirrorToMarkdown(doc([img]))).toBe("![alt text](https://img.com/a.png)");
  });

  it("converts callout", () => {
    const callout = { type: "callout", attrs: { type: "warning" }, content: [p(text("watch out"))] };
    expect(convertProseMirrorToMarkdown(doc([callout]))).toBe(":::warning\nwatch out\n:::");
  });

  it("converts math inline", () => {
    const math = { type: "mathInline", attrs: { text: "E=mc^2" } };
    expect(convertProseMirrorToMarkdown(doc([p(math)]))).toBe("$E=mc^2$");
  });

  it("converts subpages placeholder", () => {
    const sp = { type: "subpages" };
    expect(convertProseMirrorToMarkdown(doc([sp]))).toBe("{{SUBPAGES}}");
  });

  it("handles unknown node types by processing children", () => {
    const unknown = { type: "unknownNode", content: [p(text("fallback"))] };
    expect(convertProseMirrorToMarkdown(doc([unknown]))).toBe("fallback");
  });
});
