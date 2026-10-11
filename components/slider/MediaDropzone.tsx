"use client";

import { DragEvent, KeyboardEvent, useRef, useState } from "react";

type Props = {
  accept: string;
  multiple: boolean;
  hint: string;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
};

export default function MediaDropzone({ accept, multiple, hint, disabled = false, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function browse() {
    if (!disabled) inputRef.current?.click();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      browse();
    }
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled) setDragging(true);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = Array.from(event.dataTransfer.files);
    if (dropped.length) onFiles(multiple ? dropped : dropped.slice(0, 1));
  }

  // The input sits outside the drop zone so its own click doesn't bubble back
  // into browse().
  return (
    <>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={browse}
        onKeyDown={onKeyDown}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`grid cursor-pointer place-items-center gap-2 rounded-[5px] border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? "border-teal bg-teal/10" : "border-navy/25 bg-paper hover:border-teal"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span className="font-display text-lg font-bold text-navy">＋ Add media</span>
        <span className="text-sm text-muted">Drag &amp; drop {multiple ? "files" : "a file"} here, or</span>
        <span className="rounded-[5px] bg-navy px-4 py-2 text-sm font-bold text-white uppercase">
          Browse {multiple ? "files" : "file"}
        </span>
        <span className="text-xs text-muted">{hint}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const picked = Array.from(event.target.files || []);
          event.target.value = "";
          if (picked.length) onFiles(picked);
        }}
      />
    </>
  );
}
