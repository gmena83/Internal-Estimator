import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface MarkdownViewerProps {
  content: string | null | undefined;
  isLoading?: boolean;
  className?: string;
}

export function MarkdownViewer({ content, isLoading, className = "" }: MarkdownViewerProps) {
  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-32 w-full mt-6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={`flex items-center justify-center h-full text-muted-foreground ${className}`}>
        <p className="text-sm">No content to display</p>
      </div>
    );
  }

  return (
    <ScrollArea className={`h-full ${className}`}>
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownContent content={content} />
        </div>
      </div>
    </ScrollArea>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  let listItems: { level: number; content: string; ordered: boolean }[] = [];
  let inList = false;

  const parseInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/\*(.+?)\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

      const matches = [
        { type: "bold", match: boldMatch },
        { type: "italic", match: italicMatch },
        { type: "code", match: codeMatch },
        { type: "link", match: linkMatch },
      ].filter((m) => m.match !== null);

      if (matches.length === 0) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      const firstMatch = matches.reduce((a, b) =>
        (a.match?.index ?? Infinity) < (b.match?.index ?? Infinity) ? a : b
      );

      const matchIndex = firstMatch.match!.index!;
      if (matchIndex > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, matchIndex)}</span>);
      }

      switch (firstMatch.type) {
        case "bold":
          parts.push(
            <strong key={key++} className="font-semibold">
              {firstMatch.match![1]}
            </strong>
          );
          remaining = remaining.slice(matchIndex + firstMatch.match![0].length);
          break;
        case "italic":
          parts.push(
            <em key={key++} className="italic">
              {firstMatch.match![1]}
            </em>
          );
          remaining = remaining.slice(matchIndex + firstMatch.match![0].length);
          break;
        case "code":
          parts.push(
            <code
              key={key++}
              className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
            >
              {firstMatch.match![1]}
            </code>
          );
          remaining = remaining.slice(matchIndex + firstMatch.match![0].length);
          break;
        case "link":
          parts.push(
            <a
              key={key++}
              href={firstMatch.match![2]}
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {firstMatch.match![1]}
            </a>
          );
          remaining = remaining.slice(matchIndex + firstMatch.match![0].length);
          break;
      }
    }

    return parts;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const isOrdered = listItems[0].ordered;
      const ListTag = isOrdered ? "ol" : "ul";
      elements.push(
        <ListTag
          key={elements.length}
          className={`ml-6 space-y-1 ${isOrdered ? "list-decimal" : "list-disc"}`}
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-foreground">
              {parseInline(item.content)}
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
    }
    inList = false;
  };

  const flushTable = () => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={elements.length} className="overflow-x-auto my-4">
          <table className="w-full border-collapse">
            {tableHeaders.length > 0 && (
              <thead>
                <tr className="border-b border-border">
                  {tableHeaders.map((header, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left text-sm font-semibold"
                    >
                      {parseInline(header.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/50"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2 text-sm">
                      {parseInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <Card key={elements.length} className="my-4 overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b border-border">
              <span className="text-xs font-mono text-muted-foreground">
                {codeBlockLang || "code"}
              </span>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono">{codeBlockContent.join("\n")}</code>
            </pre>
          </Card>
        );
        codeBlockContent = [];
        codeBlockLang = "";
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    if (line.includes("|") && line.trim().startsWith("|")) {
      flushList();
      const cells = line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      if (cells.every((c) => c.trim().match(/^-+$/))) {
        continue;
      }
      
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    const unorderedListMatch = line.match(/^(\s*)[*-]\s+(.+)/);
    const orderedListMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
    
    if (unorderedListMatch || orderedListMatch) {
      flushTable();
      inList = true;
      const match = unorderedListMatch || orderedListMatch;
      listItems.push({
        level: match![1].length,
        content: match![2],
        ordered: !!orderedListMatch,
      });
      continue;
    } else if (inList && line.trim() === "") {
      flushList();
      continue;
    } else if (inList) {
      flushList();
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={elements.length} className="text-2xl font-semibold mt-8 mb-4 pb-2 border-b border-border">
          {parseInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={elements.length} className="text-xl font-semibold mt-6 mb-3">
          {parseInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={elements.length} className="text-lg font-medium mt-4 mb-2">
          {parseInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={elements.length} className="text-base font-medium mt-3 mb-1">
          {parseInline(line.slice(5))}
        </h4>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={elements.length}
          className="pl-4 border-l-4 border-primary/50 italic text-muted-foreground my-4"
        >
          {parseInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith("---") || line.startsWith("***")) {
      elements.push(<hr key={elements.length} className="my-6 border-border" />);
    } else if (line.trim() === "") {
      continue;
    } else {
      elements.push(
        <p key={elements.length} className="my-2 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    }
  }

  flushList();
  flushTable();

  return <>{elements}</>;
}
