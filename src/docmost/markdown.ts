interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export function convertProseMirrorToMarkdown(doc: Record<string, unknown>): string {
  return processNode(doc as unknown as ProseMirrorNode).trim();
}

function processNode(n: ProseMirrorNode): string {
  switch (n.type) {
    case "doc":
      return (n.content ?? []).map(processNode).join("\n\n");

    case "paragraph": {
      const text = children(n);
      const align = n.attrs?.textAlign as string | undefined;
      if (align && align !== "left") return `<div style="text-align:${align}">${text}</div>`;
      return text;
    }

    case "heading": {
      const level = (n.attrs?.level as number) ?? 1;
      return "#".repeat(level) + " " + children(n);
    }

    case "text": {
      let t = n.text ?? "";
      for (const mark of n.marks ?? []) {
        switch (mark.type) {
          case "bold":      t = `**${t}**`; break;
          case "italic":    t = `*${t}*`; break;
          case "code":      t = `\`${t}\``; break;
          case "strike":    t = `~~${t}~~`; break;
          case "underline": t = `<u>${t}</u>`; break;
          case "link":      t = `[${t}](${mark.attrs?.href ?? ""})`; break;
          case "highlight": {
            const color = (mark.attrs?.color as string) || "yellow";
            t = `<mark style="background:${color}">${t}</mark>`;
            break;
          }
          case "textStyle": {
            const color = mark.attrs?.color as string | undefined;
            if (color) t = `<span style="color:${color}">${t}</span>`;
            break;
          }
        }
      }
      return t;
    }

    case "codeBlock": {
      const lang = (n.attrs?.language as string) ?? "";
      return "```" + lang + "\n" + children(n) + "\n```";
    }

    case "bulletList":
      return (n.content ?? []).map(item => prefixLines(processNode(item), "-")).join("\n");

    case "orderedList":
      return (n.content ?? []).map((item, i) => prefixLines(processNode(item), `${i + 1}.`)).join("\n");

    case "taskList":
      return (n.content ?? []).map(item => {
        const checked = item.attrs?.checked as boolean | undefined;
        return `- ${checked ? "[x]" : "[ ]"} ${children(item)}`;
      }).join("\n");

    case "listItem":
      return children(n);

    case "blockquote":
      return (n.content ?? []).map(c => processNode(c).split("\n").map(l => `> ${l}`).join("\n")).join("\n");

    case "horizontalRule": return "---";
    case "hardBreak":      return "\n";

    case "image": {
      const alt = (n.attrs?.alt as string) ?? "";
      const src = (n.attrs?.src as string) ?? "";
      const caption = n.attrs?.caption as string | undefined;
      return `![${alt}](${src})${caption ? `\n*${caption}*` : ""}`;
    }

    case "video":      return `🎥 [Video](${n.attrs?.src ?? ""})`;
    case "youtube":    return `📺 [YouTube Video](${n.attrs?.src ?? ""})`;

    case "table":      return (n.content ?? []).map(processNode).join("\n");
    case "tableRow":   return "| " + (n.content ?? []).map(children).join(" | ") + " |";
    case "tableCell":
    case "tableHeader": return children(n);

    case "callout": {
      const type = ((n.attrs?.type as string) ?? "info").toLowerCase();
      return `:::${type}\n${children(n)}\n:::`;
    }

    case "details":        return children(n);
    case "detailsSummary": return `<summary>${children(n)}</summary>`;
    case "detailsContent": return children(n);

    case "mathInline": return `$${n.attrs?.text ?? ""}$`;
    case "mathBlock":  return `$$\n${n.attrs?.text ?? ""}\n$$`;

    case "mention": {
      const label = (n.attrs?.label as string) ?? (n.attrs?.id as string) ?? "";
      return `@${label}`;
    }

    case "attachment": {
      const name = (n.attrs?.fileName as string) ?? "attachment";
      return `📎 [${name}](${n.attrs?.src ?? ""})`;
    }

    case "drawio":      return "📊 [Draw.io Diagram]";
    case "excalidraw":  return "✏️ [Excalidraw Drawing]";
    case "embed":       return `🔗 [Embedded Content](${n.attrs?.src ?? ""})`;
    case "subpages":    return "{{SUBPAGES}}";

    default:
      return children(n);
  }
}

function children(n: ProseMirrorNode): string {
  return (n.content ?? []).map(processNode).join("");
}

function prefixLines(text: string, prefix: string): string {
  const lines = text.split("\n");
  return lines.map((l, i) => (i === 0 ? `${prefix} ${l}` : `  ${l}`)).join("\n");
}
