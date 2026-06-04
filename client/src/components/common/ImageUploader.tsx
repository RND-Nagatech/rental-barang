import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { absoluteFileUrl, uploadApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  label?: string;
  className?: string;
  multiple?: boolean;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
}

export function ImageUploader({
  label = "Upload foto",
  className,
  multiple,
  value,
  onChange,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [localFiles, setLocalFiles] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const files = React.useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value) return [value];
    return localFiles;
  }, [localFiles, value]);

  function updateFiles(next: string[]) {
    if (onChange) {
      onChange(multiple ? next : next[0] || "");
      return;
    }

    setLocalFiles(next);
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);

    if (selected.length === 0) return;

    setUploading(true);

    try {
      const uploaded = await Promise.all(selected.map((file) => uploadApi.upload(file)));
      const urls = uploaded.map((file) => file.url);
      const next = multiple ? [...files, ...urls] : [urls[0]];
      updateFiles(next);
      toast.success("File berhasil diunggah.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload file gagal.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={handleFiles}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
      >
        <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <ImagePlus className="size-5" />
        </span>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {uploading ? "Mengunggah..." : "Klik untuk pilih file"}
        </span>
      </button>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1 text-xs"
            >
              <FilePreview url={f} />
              <button
                type="button"
                onClick={() => updateFiles(files.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FilePreview({ url }: { url: string }) {
  const absoluteUrl = absoluteFileUrl(url);
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);

  if (isImage) {
    return (
      <a href={absoluteUrl} target="_blank" rel="noreferrer" className="block">
        <img
          src={absoluteUrl}
          alt={url.split("/").pop() || "preview"}
          className="size-14 rounded-md object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={absoluteUrl}
      target="_blank"
      rel="noreferrer"
      className="max-w-48 truncate hover:text-primary"
    >
      {url.split("/").pop()}
    </a>
  );
}
