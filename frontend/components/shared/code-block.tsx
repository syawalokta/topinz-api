"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";

/**
 * Minimal, dependency-free token highlighter.
 * Handles strings, comments, numbers, keywords, and JSON keys —
 * enough to make snippets readable without shipping a parser.
 */
function highlight(code: string): React.ReactNode[] {
  const pattern =
    /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|await|async|import|from|export|require|echo|print|def|true|false|null|None|True|False|new|curl)\b|\b(\d+(?:\.\d+)?)\b/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }
    const [full, comment, str, keyword, num] = match;
    if (comment) {
      nodes.push(
        <span key={key++} className="text-zinc-500">
          {full}
        </span>
      );
    } else if (str) {
      nodes.push(
        <span key={key++} className="text-emerald-400">
          {full}
        </span>
      );
    } else if (keyword) {
      nodes.push(
        <span key={key++} className="text-sky-400">
          {full}
        </span>
      );
    } else if (num) {
      nodes.push(
        <span key={key++} className="text-amber-300">
          {full}
        </span>
      );
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));
  return nodes;
}

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  /** Hide the header bar (language label + copy). */
  bare?: boolean;
  maxHeight?: number;
}

/** Dark-styled code panel used in docs and landing previews. */
export function CodeBlock({
  code,
  language,
  filename,
  className,
  bare = false,
  maxHeight,
}: CodeBlockProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-soft",
        className
      )}
    >
      {!bare && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <span className="font-mono text-xs text-zinc-400">
            {filename ?? language ?? "code"}
          </span>
          <CopyButton
            value={code}
            className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          />
        </div>
      )}
      <div
        className="scrollbar-thin overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <pre className="px-4 py-3.5 text-[13px] leading-6">
          <code className="font-mono">{highlight(code)}</code>
        </pre>
      </div>
    </div>
  );
}

/** Inline code pill (light/dark aware) for paths, keys, params. */
export function InlineCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]",
        className
      )}
    >
      {children}
    </code>
  );
}
