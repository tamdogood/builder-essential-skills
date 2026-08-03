import Image from "next/image";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

function safeUrl(url: string): string {
  if (url.startsWith("/api/v1/artifacts/")) return url;
  return defaultUrlTransform(url);
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrl}
        components={{
          a: ({ children: linkChildren, href }) => (
            <a href={href} rel="noreferrer" target="_blank">{linkChildren}</a>
          ),
          img: ({ alt, src }) => {
            if (typeof src !== "string" || !src.startsWith("/api/v1/artifacts/")) {
              return alt ? <span>[Image: {alt}]</span> : null;
            }
            return <Image alt={alt ?? "Experiment artifact"} height={675} src={src} unoptimized width={1200} />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
