"use client";

import { useState } from "react";

export default function ArticleShare({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://legitorganic.com/blog/${slug}`;

  const linkCls = "journal-share-link";

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="journal-share-label">Share</span>
      <a
        className={linkCls}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
      >
        X / Twitter
      </a>
      <a
        className={linkCls}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
      >
        WhatsApp
      </a>
      <button
        type="button"
        className={linkCls}
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
