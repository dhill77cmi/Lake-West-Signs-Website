"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { sendQuote } from "@/lib/send-quote";
import { Upload } from "lucide-react";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { quoteCopy } from "@/content/quote";
import type { ServiceId } from "@/content/types";
import { validateFiles, validateQuote, type QuoteErrors } from "@/lib/quote";
import { useSendPlane } from "@/components/send-plane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormSelect } from "@/components/ui/form-select";

// The same short form everywhere: the contact page only differs by arriving with the service preselected.
export function QuoteForm({ initialService, product }: { initialService?: ServiceId | "general" | "unsure"; product?: string }) {
  const prefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const requestId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [sending, setSending] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [ready, setReady] = useState(false);
  const [method, setMethod] = useState("");
  const [contactDetails, setContactDetails] = useState({ phone: "", email: "" });
  const [service, setService] = useState<string>(initialService ?? "");
  const [errors, setErrors] = useState<QuoteErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const { play: playSend, iconStyle } = useSendPlane();
  const [missing, setMissing] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => setReady(true), []);
  const id = (name: string) => `${prefix}-${name}`;
  const errorProps = (name: keyof QuoteErrors) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? id(`${name}-error`) : undefined });
  const error = (name: keyof QuoteErrors) => errors[name] && <p id={id(`${name}-error`)} className="text-small font-semibold">{errors[name]}</p>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setDeliveryError("");
    const nextErrors = data.get("companyWebsite") ? {} : validateQuote(data);
    setErrors(nextErrors);
    setMissing(Object.keys(nextErrors).length > 0);
    if (Object.keys(nextErrors).length) {
      setSubmitted(false);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    inFlight.current = true;
    setSending(true);
    requestId.current ??= crypto.randomUUID();
    try { await sendQuote(data, requestId.current); }
    catch (error) {
      setDeliveryError(error instanceof Error ? error.message : quoteCopy.deliveryError);
      return;
    } finally { inFlight.current = false; setSending(false); }
    requestId.current = null;
    playSend();
    setSubmitted(true);
    setSent(true);
    // Clear the inquiry once it is sent: native fields reset themselves, the controlled ones go back to their defaults.
    form.reset();
    setMethod("");
    setContactDetails({ phone: "", email: "" });
    setService(initialService ?? "");
    setFileNames([]);
    setErrors({});
  }
  // Until a method is chosen the detail field takes either a phone number or an email address.
  const detailLabel = method === "phone" || method === "email" || method === "text" ? quoteCopy.labels[method] : quoteCopy.labels.detail;
  return (
    <form ref={formRef} method="post" encType="multipart/form-data" noValidate onSubmit={submit} onChange={() => { setSubmitted(false); setMissing(false); }} aria-label="Project inquiry" className="flex min-w-0 flex-col gap-6">
      <FieldGroup className="sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor={id("name")} data-required>{quoteCopy.labels.name}</FieldLabel>
          <Input id={id("name")} name="name" autoComplete="name" required {...errorProps("name")} />{error("name")}
        </Field>
        <Field data-invalid={Boolean(errors.contactMethod)}>
          <FieldLabel htmlFor={id("contactMethod")} data-required>{quoteCopy.labels.contactMethod}</FieldLabel>
          <FormSelect id={id("contactMethod")} name="contactMethod" value={method} onValueChange={(value) => { setMethod(value); setErrors((old) => ({ ...old, contactDetail: undefined })); setSubmitted(false); }} placeholder={quoteCopy.placeholder} options={quoteCopy.contactMethods} {...errorProps("contactMethod")} />{error("contactMethod")}
        </Field>
        <Field data-invalid={Boolean(errors.contactDetail)}>
          <FieldLabel htmlFor={id("contactDetail")} data-required>{detailLabel}</FieldLabel>
          <Input id={id("contactDetail")} name="contactDetail" type={method === "email" ? "email" : method ? "tel" : "text"} autoComplete={method === "email" ? "email" : method ? "tel" : undefined} value={contactDetails[method === "email" ? "email" : "phone"]} onChange={(event) => setContactDetails((old) => ({ ...old, [method === "email" ? "email" : "phone"]: event.target.value }))} required {...errorProps("contactDetail")} />{error("contactDetail")}
        </Field>
        <Field data-invalid={Boolean(errors.service)}>
          <FieldLabel htmlFor={id("service")} data-required>{quoteCopy.labels.service}</FieldLabel>
          <FormSelect id={id("service")} name="service" value={service} onValueChange={(value) => { setService(value); setSubmitted(false); }} placeholder={quoteCopy.placeholder} options={[...services.map(item => ({ value: item.id, label: item.name })), { value: "unsure", label: quoteCopy.notSure }, { value: "general", label: quoteCopy.generalInquiry }]} {...errorProps("service")} />{error("service")}
        </Field>
      </FieldGroup>
      <Field data-invalid={Boolean(errors.message)}>
        <FieldLabel htmlFor={id("message")} data-required>{quoteCopy.labels.message}</FieldLabel>
        <Textarea id={id("message")} name="message" required defaultValue={product ? `${product}: ` : ""} {...errorProps("message")} />{error("message")}
      </Field>
      <Field data-invalid={Boolean(errors.files)}>
        <FieldLabel htmlFor={id("files")}>{quoteCopy.labels.files}</FieldLabel>
        <div className="file-drop">
          <Input id={id("files")} name="files" type="file" multiple accept={quoteCopy.fileAccept} aria-invalid={Boolean(errors.files)} aria-describedby={errors.files ? id("files-error") : undefined} onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            setErrors((old) => ({ ...old, files: validateFiles(files) })); setFileNames(files.map((file) => file.name)); setSubmitted(false);
          }} />
          <Upload aria-hidden="true" />
          <span role="status" className="break-words">{fileNames.length ? fileNames.join(", ") : "Choose files or drop them here"}</span>
        </div><p className="text-small text-muted-foreground">{quoteCopy.fileHint}</p>{error("files")}
      </Field>
      <div hidden aria-hidden="true"><label htmlFor={id("companyWebsite")}>Leave this field empty</label><input id={id("companyWebsite")} name="companyWebsite" tabIndex={-1} autoComplete="off" /></div>
      <input type="hidden" name="formVersion" value="1" />
      <div className="flex flex-wrap items-center gap-4"><Button type="submit" disabled={!ready || sending}><span aria-hidden="true" className="send-icon" style={iconStyle} />{quoteCopy.submit}</Button>{missing ? <p className="required-hint" role="status">*Enter required fields</p> : sent && <p className="sent-note" role="status">Your message has been sent.</p>}</div>
      {deliveryError && <p role="alert" className="text-small font-semibold">{deliveryError}</p>}
      {sending && <p role="status">Sending your request…</p>}
      <noscript><p>{quoteCopy.preview} <a href={site.phoneHref}>{site.phone}</a></p></noscript>
    </form>
  );
}
