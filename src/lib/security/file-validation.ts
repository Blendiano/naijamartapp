const MIME_TO_EXT: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
};

const MAGIC_BYTES: Array<{
  mime: string;
  signatures: Array<{ offset: number; bytes: string[] }>;
}> = [
  {
    mime: "image/png",
    signatures: [{ offset: 0, bytes: ["89", "50", "4E", "47", "0D", "0A", "1A", "0A"] }],
  },
  {
    mime: "image/jpeg",
    signatures: [
      { offset: 0, bytes: ["FF", "D8", "FF", "DB"] },
      { offset: 0, bytes: ["FF", "D8", "FF", "E0"] },
      { offset: 0, bytes: ["FF", "D8", "FF", "E1"] },
      { offset: 0, bytes: ["FF", "D8", "FF", "E2"] },
      { offset: 0, bytes: ["FF", "D8", "FF", "E3"] },
      { offset: 0, bytes: ["FF", "D8", "FF", "E8"] },
    ],
  },
  {
    mime: "image/webp",
    signatures: [
      { offset: 0, bytes: ["52", "49", "46", "46"] },
    ],
  },
  {
    mime: "image/avif",
    signatures: [{ offset: 4, bytes: ["61", "76", "69", "66"] }],
  },
];

function bytesToHex(bytes: Uint8Array, offset: number, len: number): string {
  const slice = bytes.slice(offset, offset + len);
  return Array.from(slice)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
}

function hexMatches(signatureHex: string, actualHex: string): boolean {
  return signatureHex.toLowerCase() === actualHex.toLowerCase();
}

export async function validateImageFile(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const matcher of MAGIC_BYTES) {
    for (const sig of matcher.signatures) {
      const end = sig.offset + sig.bytes.length;
      if (end > bytes.length) continue;
      const actualHex = bytesToHex(bytes, sig.offset, sig.bytes.length);
      if (hexMatches(sig.bytes.join(""), actualHex)) {
        if (file.type && file.type !== matcher.mime) {
          if (!MIME_TO_EXT[matcher.mime]?.some((e) => file.name?.toLowerCase().endsWith(e))) {
            return { valid: false, error: "File content/type mismatch" };
          }
        }
        return { valid: true };
      }
    }
  }

  return {
    valid: false,
    error: "Invalid image format or corrupted file",
  };
}
