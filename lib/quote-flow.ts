import { detailQuestions, flowCopy, type ChoiceQuestion, type FlowService, type Question } from "../content/quote-flow";
import { services } from "../content/services";

export type StepId = "service" | "details" | "question" | "timing" | "extra" | "contact";
export type Answers = Record<string, string>;

// A question has its own screen instead of details, timing and notes; a known service skips the service screen.
export function stepsFor(service: FlowService | undefined, skipService: boolean): StepId[] {
  const rest: StepId[] = service === "general" ? ["question", "contact"] : ["details", "timing", "extra", "contact"];
  return [...(skipService ? [] : ["service" as const]), ...rest];
}

export const questionComplete = (answers: Answers): boolean => Boolean(answers.message?.trim());

export const isChoice = (question: Question): question is ChoiceQuestion => "choices" in question;

export function visibleQuestions(service: FlowService, answers: Answers): Question[] {
  return detailQuestions[service].filter((question) => isChoice(question) || !question.when || answers[question.when.name] === question.when.value);
}

export function firstUnanswered(service: FlowService, answers: Answers): string | undefined {
  return visibleQuestions(service, answers).find((question) => isChoice(question) && !answers[question.name])?.name;
}

export function summaryLines(service: FlowService, answers: Answers): { step: StepId; label: string; text: string }[] {
  if (service === "general") {
    const message = answers.message?.trim() ?? "";
    return [{ step: "question", label: flowCopy.summary.question, text: message.length > 80 ? `${message.slice(0, 80)}…` : message }];
  }
  const name = service === "unsure" ? flowCopy.service.custom : services.find((item) => item.id === service)!.name;
  const kind = detailQuestions[service].find((question): question is ChoiceQuestion => question.name === "kind" && isChoice(question));
  const kindLabel = kind?.choices.find((choice) => choice.value === answers.kind)?.label;
  const timing = flowCopy.timing.choices.find((choice) => choice.value === answers.timing)?.label;
  return [
    { step: "details", label: flowCopy.summary.service, text: kindLabel ? `${name} · ${kindLabel}` : name },
    ...(timing ? [{ step: "timing" as const, label: flowCopy.summary.timing, text: timing }] : []),
  ];
}
