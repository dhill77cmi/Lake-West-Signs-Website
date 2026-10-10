import { quoteCopy } from "../content/quote";
import { services } from "../content/services";

export type QuoteErrors = Partial<Record<"name" | "contactMethod" | "contactDetail" | "service" | "message" | "files", string>>;
export type FileInfo = { name: string; size: number; type: string };

export function validateFiles(files: FileInfo[]): string | undefined {
  if (files.length > 5) return "Please attach no more than 5 files.";
  if (files.reduce((total, file) => total + file.size, 0) > quoteCopy.maxFileBytes) return quoteCopy.errors.fileSize;
  if (files.some((file) => !/\.(pdf|ai|eps|png|jpe?g|webp|gif|avif|heic|heif|tiff?|bmp|svg)$/i.test(file.name))) return quoteCopy.errors.fileType;
}

export function validateContact(data: FormData): QuoteErrors {
  const read = (name: string) => String(data.get(name) ?? "").trim();
  const errors: QuoteErrors = {};
  if (!read("name")) errors.name = quoteCopy.errors.name;
  const method = read("contactMethod");
  if (!["phone", "email", "text"].includes(method)) errors.contactMethod = quoteCopy.errors.contactMethod;
  const detail = read("contactDetail");
  // The detail is checked against the chosen method; with no method yet, that error already blocks the send.
  if (!errors.contactMethod && (method === "email" ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(detail) : !/^[+()\d\s.\-]+$/.test(detail) || detail.replace(/\D/g, "").length < 7)) {
    errors.contactDetail = method === "email" ? quoteCopy.errors.email : quoteCopy.errors.phone;
  }
  return errors;
}

// Pure validation + stable form field names can also be used by the future server handler.
// File validation here is a UI convenience, not a substitute for server-side validation.
export function validateQuote(data: FormData): QuoteErrors {
  const read = (name: string) => String(data.get(name) ?? "").trim();
  const errors = validateContact(data);
  if (!["unsure", "general"].includes(read("service")) && !services.some((service) => service.id === read("service"))) errors.service = quoteCopy.errors.service;
  if (!read("message")) errors.message = quoteCopy.errors.message;
  const files = data.getAll("files").filter((file): file is File => typeof file !== "string" && file.size > 0);
  const fileError = validateFiles(files);
  if (fileError) errors.files = fileError;
  return errors;
}
