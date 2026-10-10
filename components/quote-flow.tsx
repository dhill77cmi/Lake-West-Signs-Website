"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { sendQuote } from "@/lib/send-quote";
import { Upload } from "lucide-react";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { quoteCopy } from "@/content/quote";
import { flowCopy, productKind, type Choice, type FlowService } from "@/content/quote-flow";
import { firstUnanswered, isChoice, questionComplete, stepsFor, summaryLines, visibleQuestions, type Answers, type StepId } from "@/lib/quote-flow";
import { validateContact, validateFiles, type QuoteErrors } from "@/lib/quote";
import { gsap, useGSAP, motionConditions, motionTokens } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";

type Errors = QuoteErrors & { details?: string; question?: string };
type Method = "" | "phone" | "email" | "text";

const startingAnswers = (product?: string): Answers => (product && productKind[product] ? { kind: productKind[product] } : {});

// Five screens at most: service → details → timing → anything else → contact; a question is service → question → contact. Answers live in state so Back and Edit keep them.
export function QuoteFlow({ initialService, product, headingLevel = 3 }: { initialService?: FlowService; product?: string; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const prefix = useId();
  const id = (name: string) => `${prefix}-${name}`;
  // A known service skips the first screen until the visitor taps "Change"; from then on the flow has all five screens.
  const [skipService, setSkipService] = useState(Boolean(initialService));
  const [service, setService] = useState<FlowService | undefined>(initialService);
  const [answers, setAnswers] = useState<Answers>(() => startingAnswers(product));
  const steps = stepsFor(service, skipService);
  const [step, setStep] = useState<StepId>(steps[0]);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [method, setMethod] = useState<Method>("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [fileNames, setFileNames] = useState<string[]>([]);
  const requestId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const scope = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const previous = useRef<StepId | null>(null);
  const shown = useRef<string | null>(null);
  const barWidth = useRef<string | undefined>(undefined);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finishing = useRef<{ timeline: gsap.core.Timeline; targets: Element[] } | null>(null);
  useEffect(() => setReady(true), []);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const index = steps.indexOf(step);
  const go = (next: StepId) => {
    // The receipt lives on the contact screen, so Back and Edit wait while the request is being sent.
    if (inFlight.current || sending) return;
    // A Back or Next tapped during a tap's feedback beat wins over the pending advance.
    clearTimeout(advanceTimer.current);
    const target = steps.includes(next) ? next : steps[0];
    setDirection(steps.indexOf(target) > index ? 1 : -1);
    setStep(target);
    setErrors({});
  };
  const answer = (name: string, value: string) => setAnswers((old) => ({ ...old, [name]: value }));
  // A tap shows its pressed state for one feedback beat before the screen moves; reduced motion moves at once.
  const advance = (fn: () => void) => {
    clearTimeout(advanceTimer.current);
    if (matchMedia(motionConditions.reduce).matches || !scope.current) { fn(); return; }
    advanceTimer.current = setTimeout(fn, motionTokens(scope.current).feedback * 1000);
  };
  // A new service clears only its detail answers; the timing and notes screens do not depend on the service.
  const keepShared = ({ timing, message }: Answers): Answers => ({ ...(timing ? { timing } : {}), ...(message ? { message } : {}) });
  const pickService = (next: FlowService) => {
    if (next !== service) setAnswers(keepShared);
    setService(next);
    advance(() => { setDirection(1); setStep(next === "general" ? "question" : "details"); setErrors({}); });
  };

  // Slide the new screen in from the side it came from while the step text and bar move with it, on one clock.
  // React sets the bar's final width; the tween only adds the travel.
  useGSAP(() => {
    const root = scope.current;
    const panel = root?.querySelector<HTMLElement>("[data-step]");
    const bar = root?.querySelector<HTMLElement>("[data-progress]");
    const progressText = root?.querySelector<HTMLElement>("[data-progress-text]");
    if (!root || !panel || !bar || !progressText || sent) return;
    // Tween between explicit widths: reverting the last tween restores a stale inline width, so React's value cannot be the end.
    const width = `${((index + 1) / steps.length) * 100}%`;
    const from = barWidth.current ?? width;
    barWidth.current = width;
    // Strict Mode runs layout effects twice on mount; the same step twice is still first paint.
    const first = previous.current === null || previous.current === step;
    previous.current = step;
    if (first) return;
    const tokens = motionTokens(root);
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      if (conditions?.reduce) return;
      gsap.timeline({ defaults: { duration: tokens.step, ease: tokens.ease } })
        .from(panel, { x: direction * 32, opacity: 0, clearProps: "transform,opacity" }, 0)
        .from(progressText, { autoAlpha: 0, y: 4, clearProps: "transform,opacity,visibility" }, 0)
        .fromTo(bar, { width: from }, { width }, 0);
    });
    return () => media.revert();
  }, { scope, dependencies: [step, sent], revertOnUpdate: true });

  // useGSAP runs as a layout effect before this one, so `previous` cannot tell first paint apart; `shown` does.
  // It keeps the last screen rather than a flag, so Strict Mode's second mount run does not steal focus.
  useEffect(() => {
    const first = shown.current === null || shown.current === `${step}-${sent}`;
    shown.current = `${step}-${sent}`;
    if (first) return;
    // Focus scrolls the new heading into view, under the sticky header, when a long screen gives way to a short one.
    if (sent) done.current?.focus();
    else heading.current?.focus();
  }, [step, sent]);

  // The finish keeps its own context: the step effect above reverts its context whenever `sent` changes, which would undo it.
  const { contextSafe } = useGSAP({ scope });
  // The Submit button grows into a blue panel while the rest of the form folds away, so the page shortens smoothly.
  // React unmounts the folded parts only once the timeline lands; globals.css holds the sent state's resting styles.
  const finish = contextSafe(() => {
    const root = scope.current!;
    const one = (selector: string) => root.querySelector<HTMLElement>(selector)!;
    const sky = one("[data-sky]"), button = one('button[type="submit"]'), after = one("[data-after]"), stamp = one(".flow-stamp");
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".flow-receipt-row")), edits = Array.from(root.querySelectorAll<HTMLElement>(".flow-summary button"));
    const leaving = [one(".flow-progress"), heading.current!, one("[data-fields]")];
    const lines = Array.from(after.children), label = Array.from(button.children);
    const css = getComputedStyle(root), tokens = motionTokens(root);
    // GSAP tweens a rem border radius from 0px as if it were px, so hand it pixels.
    const panel = { padding: css.getPropertyValue("--spacing-panel"), radius: parseFloat(css.getPropertyValue("--radius-panel")) * parseFloat(getComputedStyle(document.documentElement).fontSize) };
    // A folding element also takes back the flex gap below it, and a growing one starts by cancelling the gap above it,
    // so unmounting the folded parts at the end moves nothing.
    const gap = (element: Element) => `-${getComputedStyle(element.parentElement!).rowGap}`;
    const box = root.getBoundingClientRect(), start = button.getBoundingClientRect();
    const growing = [...rows, after];
    const targets = [root, sky, stamp, ...lines, ...label, ...edits, ...leaving, ...growing];
    gsap.set(root, { position: "relative", overflow: "hidden" });
    gsap.set(sky, { visibility: "visible", left: start.left - box.left, top: start.top - box.top, width: start.width, height: start.height, borderRadius: getComputedStyle(button).borderRadius });
    // The panel's padding narrows the rows and the message as they grow, so measure them at that final width, before any paint.
    gsap.set(root, { padding: panel.padding });
    gsap.set(growing, { display: "flex" });
    const grown = growing.map((element) => element.getBoundingClientRect().height);
    gsap.set(root, { padding: 0 });
    gsap.set(growing, { height: 0, marginTop: (_: number, element: Element) => gap(element) });
    gsap.set([...leaving, ...rows], { overflow: "hidden" });
    gsap.set(rows, { autoAlpha: 0 });
    const timeline = gsap.timeline({
      defaults: { duration: tokens.finish, ease: tokens.ease },
      onComplete: () => {
        flushSync(() => { setSending(false); setSent(true); });
        gsap.set(targets, { clearProps: "all" });
        finishing.current = null;
      },
    })
      // Opacity, not autoAlpha: a hidden label would drop the button's accessible name mid-send.
      .to(label, { opacity: 0, duration: tokens.feedback }, 0)
      .to(sky, { left: 0, top: 0, width: "100%", height: "100%", borderRadius: panel.radius, ease: "power3.inOut" }, 0)
      // Every height change shares one ease-in-out clock, so the page shortens evenly instead of dropping in the first frames.
      .to(root, { padding: panel.padding, borderRadius: panel.radius, ease: "power2.inOut" }, 0)
      .to(leaving, { height: 0, marginTop: 0, marginBottom: (_: number, element: Element) => gap(element), autoAlpha: 0, ease: "power2.inOut" }, 0)
      .to(edits, { height: 0, minHeight: 0, autoAlpha: 0, ease: "power2.inOut" }, 0)
      .to(growing, { height: (index: number) => grown[index], marginTop: 0, ease: "power2.inOut" }, 0)
      .to(rows, { autoAlpha: 1 }, 0)
      .fromTo(stamp, { autoAlpha: 0, scale: 2.2, rotation: -14 }, { autoAlpha: 1, scale: 1, rotation: -8, duration: tokens.step, ease: "back.out(2.5)" })
      .from(lines, { y: 12, autoAlpha: 0, duration: tokens.step, stagger: tokens.feedback }, `-=${tokens.step / 2}`);
    finishing.current = { timeline, targets };
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || sending) return;
    const data = new FormData(event.currentTarget);
    if (data.get("companyWebsite")) { setSent(true); return; }
    setDeliveryError("");
    const nextErrors: Errors = validateContact(data);
    const files = data.getAll("files").filter((file): file is File => typeof file !== "string" && file.size > 0);
    const fileError = validateFiles(files);
    if (fileError) nextErrors.files = fileError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      // The file input is only shown on the notes screen, so a file error sends the visitor back there to fix it.
      if (nextErrors.files) { setDirection(-1); setStep("extra"); }
      // The contact-method group cannot take focus itself, so its first choice does.
      requestAnimationFrame(() => {
        const invalid = scope.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        (invalid && invalid.tabIndex < 0 ? invalid.querySelector<HTMLElement>("button") : invalid)?.focus();
      });
      return;
    }
    inFlight.current = true;
    setSending(true);
    requestId.current ??= crypto.randomUUID();
    try {
      await sendQuote(data, requestId.current);
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : quoteCopy.deliveryError);
      setSending(false);
      inFlight.current = false;
      return;
    }
    inFlight.current = false;
    requestId.current = null;
    if (matchMedia(motionConditions.reduce).matches) { setSending(false); setSent(true); return; }
    finish();
  }

  function restart() {
    if (finishing.current) {
      finishing.current.timeline.kill();
      gsap.set(finishing.current.targets, { clearProps: "all" });
      finishing.current = null;
    }
    clearTimeout(advanceTimer.current);
    setSending(false);
    setDeliveryError("");
    requestId.current = null;
    scope.current?.reset();
    // Another request starts from an empty first screen, even where the page arrived with a service or product chosen.
    setService(undefined);
    setAnswers({});
    setMethod("");
    setContact({ name: "", phone: "", email: "" });
    setErrors({});
    setFileNames([]);
    previous.current = null;
    setSkipService(false);
    setStep("service");
    setSent(false);
  }

  const errorProps = (name: keyof Errors) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? id(`${name}-error`) : undefined });
  const error = (name: keyof Errors, role?: "status") => errors[name] && <p id={id(`${name}-error`)} role={role} className="text-small font-semibold">{errors[name]}</p>;
  const missing = service ? firstUnanswered(service, answers) : undefined;

  const choices = (name: string, list: Choice[], onPick?: () => void) => (
    <div className="choice-grid" role="group" aria-labelledby={id(`${name}-label`)} aria-invalid={Boolean(errors.details && missing === name)} aria-describedby={errors.details && missing === name ? id("details-error") : undefined}>
      {list.map((choice) => (
        <Button disabled={sending} key={choice.value} type="button" variant="outline" className="choice" aria-pressed={answers[name] === choice.value} onClick={() => { answer(name, choice.value); onPick?.(); }}>{choice.label}</Button>
      ))}
    </div>
  );

  const detailLabel = method === "phone" || method === "email" || method === "text" ? quoteCopy.labels[method] : quoteCopy.labels.detail;
  const serviceChoices: Choice[] = [...services.map((item) => ({ value: item.id, label: item.name })), { value: "unsure", label: flowCopy.service.custom }, { value: "general", label: flowCopy.service.question }];
  const extraEmpty = !answers.message && fileNames.length === 0;
  const posted = new Set([...(service ? visibleQuestions(service, answers).map((question) => question.name) : []), "timing", "message", "order"]);
  const reachBy = quoteCopy.contactMethods.find((choice) => choice.value === method)?.label;
  const change = skipService && <button type="button" className="text-link" onClick={() => { setSkipService(false); setService(undefined); setAnswers(keepShared); setDirection(-1); setStep("service"); setErrors({}); }}>{flowCopy.change}</button>;

  return (
    <form ref={scope} method="post" encType="multipart/form-data" noValidate onSubmit={submit} aria-label={flowCopy.formLabel} className="quote-flow" data-sent={sent}>
      <div data-sky className="flow-sky" aria-hidden="true" />
          {!sent && <div className="flow-progress">
            <p id={id("progress")} data-progress-text className="text-small text-muted-foreground">{flowCopy.progress(index + 1, steps.length)}</p>
            <div className="flow-progress-bar" aria-hidden="true"><span data-progress style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
          </div>}
          <div data-step={step} className="flex min-w-0 flex-col gap-6">
            {step === "service" && <>
              <Heading ref={heading} tabIndex={-1} aria-describedby={id("progress")} className="text-title">{flowCopy.service.label}</Heading>
              <div className="choice-grid" role="group" aria-label={flowCopy.service.label}>
                {serviceChoices.map((choice) => <Button disabled={sending} key={choice.value} type="button" variant="outline" className="choice" aria-pressed={service === choice.value} onClick={() => pickService(choice.value as FlowService)}>{choice.label}</Button>)}
              </div>
            </>}
            {step === "details" && service && <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Heading ref={heading} tabIndex={-1} aria-describedby={id("progress")} className="text-title">{flowCopy.details.label}</Heading>
                {change}
              </div>
              {visibleQuestions(service, answers).map((question) => isChoice(question) ? (
                <div key={question.name} className="flex flex-col gap-3">
                  <p id={id(`${question.name}-label`)} className="text-label">{question.label}</p>
                  {choices(question.name, question.choices)}
                </div>
              ) : (
                <Field key={question.name}>
                  <FieldLabel htmlFor={id(question.name)}>{question.label} {flowCopy.details.optional}</FieldLabel>
                  <Input id={id(question.name)} value={answers[question.name] ?? ""} placeholder={question.placeholder} onChange={(event) => answer(question.name, event.target.value)} />
                </Field>
              ))}
              {errors.details && <p id={id("details-error")} className="required-hint" role="status">{errors.details}</p>}
              <div className="flex flex-wrap gap-3">
                {!skipService && <Button type="button" variant="outline" onClick={() => go("service")}>{flowCopy.back}</Button>}
                <Button type="button" onClick={() => {
                  if (!missing) { go("timing"); return; }
                  setErrors({ details: flowCopy.errors.details });
                  scope.current?.querySelector<HTMLElement>(`[aria-labelledby="${id(`${missing}-label`)}"] button`)?.focus();
                }}>{flowCopy.next}</Button>
              </div>
            </>}
            {step === "question" && <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Heading ref={heading} tabIndex={-1} aria-describedby={id("progress")} id={id("question-label")} className="text-title">{flowCopy.question.label}</Heading>
                {change}
              </div>
              <Textarea id={id("message")} aria-labelledby={id("question-label")} required value={answers.message ?? ""} placeholder={flowCopy.question.placeholder} onChange={(event) => answer("message", event.target.value)} aria-invalid={Boolean(errors.question)} aria-describedby={errors.question ? id("question-error") : undefined} />
              <div className="flex flex-col gap-3">
                <p id={id("order-label")} className="text-label">{flowCopy.question.order.label}</p>
                {choices("order", flowCopy.question.order.choices)}
              </div>
              {errors.question && <p id={id("question-error")} role="status" className="required-hint">{errors.question}</p>}
              <div className="flex flex-wrap gap-3">
                {!skipService && <Button type="button" variant="outline" onClick={() => go("service")}>{flowCopy.back}</Button>}
                <Button type="button" onClick={() => {
                  if (questionComplete(answers)) { go("contact"); return; }
                  setErrors({ question: flowCopy.errors.question });
                  document.getElementById(id("message"))?.focus();
                }}>{flowCopy.next}</Button>
              </div>
            </>}
            {step === "timing" && <>
              <Heading ref={heading} tabIndex={-1} aria-describedby={id("progress")} id={id("timing-label")} className="text-title">{flowCopy.timing.label}</Heading>
              {choices("timing", flowCopy.timing.choices, () => advance(() => go("extra")))}
              <div><Button type="button" variant="outline" onClick={() => go(steps[index - 1])}>{flowCopy.back}</Button></div>
            </>}
            {step === "extra" && <>
              <Heading ref={heading} tabIndex={-1} aria-describedby={id("progress")} className="text-title">{flowCopy.extra.label}</Heading>
              <Field>
                <FieldLabel htmlFor={id("message")}>{flowCopy.extra.message} {flowCopy.details.optional}</FieldLabel>
                <Textarea id={id("message")} value={answers.message ?? ""} placeholder={flowCopy.extra.placeholder} onChange={(event) => answer("message", event.target.value)} />
              </Field>
            </>}
            {step === "contact" && <>
              {!sent && <Heading ref={heading} tabIndex={-1} aria-describedby={id("progress")} className="text-title">{service === "general" ? flowCopy.contact.answerLabel : flowCopy.contact.label}</Heading>}
              {/* The summary card never unmounts: on send it gains the contact rows and the stamp and becomes the receipt. */}
              <div className="flow-receipt">
                <ul className="flow-summary">
                  {service && summaryLines(service, answers).map((line) => (
                    <li key={line.step}><span className="text-small text-muted-foreground">{line.label}</span><span>{line.text}</span><button type="button" className="text-link text-small" onClick={() => go(line.step)} aria-label={`${flowCopy.edit} ${line.label.toLowerCase()}`}>{flowCopy.edit}</button></li>
                  ))}
                  <li className="flow-receipt-row"><span className="text-small text-muted-foreground">{quoteCopy.labels.name}</span><span>{contact.name.trim()}</span></li>
                  <li className="flow-receipt-row"><span className="text-small text-muted-foreground">{flowCopy.summary.reach}</span><span>{reachBy && `${reachBy} · ${contact[method === "email" ? "email" : "phone"].trim()}`}</span></li>
                </ul>
                <span className="flow-stamp">{flowCopy.stamp}</span>
              </div>
              {!sent && <div data-fields className="flex flex-col gap-6">
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor={id("name")} data-required>{quoteCopy.labels.name}</FieldLabel>
                <Input disabled={sending} id={id("name")} name="name" autoComplete="name" required value={contact.name} onChange={(event) => setContact((old) => ({ ...old, name: event.target.value }))} {...errorProps("name")} />{error("name")}
              </Field>
              <div className="flex flex-col gap-3">
                <p id={id("contactMethod-label")} className="text-label" data-required>{flowCopy.contact.method}</p>
                <div className="choice-grid contact-method-choices" role="group" aria-labelledby={id("contactMethod-label")} {...errorProps("contactMethod")}>
                  {quoteCopy.contactMethods.map((choice) => <Button disabled={sending} key={choice.value} type="button" variant="outline" className="choice" aria-pressed={method === choice.value} onClick={() => { setMethod(choice.value as Method); setErrors((old) => ({ ...old, contactMethod: undefined, contactDetail: undefined })); }}>{choice.label}</Button>)}
                </div>{error("contactMethod", "status")}
              </div>
              <Field data-invalid={Boolean(errors.contactDetail)}>
                <FieldLabel htmlFor={id("contactDetail")} data-required>{detailLabel}</FieldLabel>
                <Input disabled={sending} id={id("contactDetail")} name="contactDetail" type={method === "email" ? "email" : method ? "tel" : "text"} autoComplete={method === "email" ? "email" : method ? "tel" : undefined} value={contact[method === "email" ? "email" : "phone"]} onChange={(event) => setContact((old) => ({ ...old, [method === "email" ? "email" : "phone"]: event.target.value }))} required {...errorProps("contactDetail")} />{error("contactDetail")}
              </Field>
              <div className="flex flex-wrap items-center gap-4">
                <Button type="button" variant="outline" onClick={() => go(steps[index - 1])}>{flowCopy.back}</Button>
                <Button type="submit" disabled={!ready || sending} aria-disabled={sending}><span aria-hidden="true" className="send-icon" /><span>{flowCopy.submit}</span></Button>
              </div>
              </div>}
              <div ref={done} data-after tabIndex={-1} role="status" className="flow-after">
                <p className="text-headline">{flowCopy.sent}</p>
                <p>{flowCopy.sentDetail}</p>
                <div><Button type="button" variant="inverse-outline" onClick={restart}>{flowCopy.again}</Button></div>
              </div>
            </>}
          </div>
          {/* The file input stays mounted on every screen so chosen files survive Back and Edit; it is only shown on the notes screen. */}
          <Field hidden={step !== "extra"} data-invalid={Boolean(errors.files)}>
            <FieldLabel htmlFor={id("files")}>{quoteCopy.labels.files}</FieldLabel>
            <div className="file-drop">
              <Input id={id("files")} name="files" type="file" multiple accept={quoteCopy.fileAccept} aria-invalid={Boolean(errors.files)} aria-describedby={errors.files ? id("files-error") : undefined} onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                setErrors((old) => ({ ...old, files: validateFiles(files) })); setFileNames(files.map((file) => file.name));
              }} />
              <Upload aria-hidden="true" />
              <span role="status" className="break-words">{fileNames.length ? fileNames.join(", ") : "Choose files or drop them here"}</span>
            </div><p className="text-small text-muted-foreground">{quoteCopy.fileHint}</p>{error("files")}
          </Field>
          {step === "extra" && <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => go("timing")}>{flowCopy.back}</Button>
            <Button type="button" onClick={() => {
              if (!errors.files) { go("contact"); return; }
              document.getElementById(id("files"))?.focus();
            }}>{extraEmpty ? flowCopy.skip : flowCopy.next}</Button>
          </div>}
          {/* Only answers the current screens can show are posted, so a changed service or install choice leaves nothing stale behind. */}
          {Object.entries(answers).filter(([name]) => posted.has(name)).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          {service && <input type="hidden" name="service" value={service} />}
          {product && service === initialService && (!productKind[product] || answers.kind === productKind[product]) && <input type="hidden" name="product" value={product} />}
          <input type="hidden" name="contactMethod" value={method} />
          <input type="hidden" name="formVersion" value="2" />
      <div hidden aria-hidden="true"><label htmlFor={id("companyWebsite")}>Leave this field empty</label><input id={id("companyWebsite")} name="companyWebsite" tabIndex={-1} autoComplete="off" /></div>
      {deliveryError && <p role="alert" className="text-small font-semibold">{deliveryError}</p>}
      {sending && !sent && <p role="status" className="text-small">Sending your request…</p>}
      <noscript><p>{quoteCopy.preview} <a href={site.phoneHref}>{site.phone}</a></p></noscript>
    </form>
  );
}
