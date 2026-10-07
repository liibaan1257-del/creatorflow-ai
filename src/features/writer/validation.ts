import {
  LANGUAGES,
  TONES,
  WRITER_LIMITS,
  WRITER_TYPES,
  type Language,
  type Tone,
  type WriterType,
} from "@/features/writer/config";

/** Server-side validation of an AI Writer request (the source of truth). */

export type WriterInput = {
  type: WriterType;
  topic: string;
  tone: Tone;
  language: Language;
  keywords: string;
  instructions: string;
};

export type WriterField = keyof WriterInput;

export type WriterValidation =
  | { ok: true; data: WriterInput }
  | { ok: false; fieldErrors: Partial<Record<WriterField, string>> };

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function parseWriterInput(body: unknown): WriterValidation {
  const raw = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const input = {
    type: asString(raw.type),
    topic: asString(raw.topic),
    tone: asString(raw.tone),
    language: asString(raw.language),
    keywords: asString(raw.keywords),
    instructions: asString(raw.instructions),
  };

  const fieldErrors: Partial<Record<WriterField, string>> = {};
  if (!WRITER_TYPES.some((t) => t.id === input.type)) fieldErrors.type = "Choose a content type.";
  if (input.topic.length < WRITER_LIMITS.topicMin) {
    fieldErrors.topic = `Describe your topic in at least ${WRITER_LIMITS.topicMin} characters.`;
  } else if (input.topic.length > WRITER_LIMITS.topicMax) {
    fieldErrors.topic = `Keep the topic under ${WRITER_LIMITS.topicMax} characters.`;
  }
  if (!TONES.some((t) => t.value === input.tone)) fieldErrors.tone = "Choose a tone.";
  if (!LANGUAGES.some((l) => l.value === input.language)) fieldErrors.language = "Choose a language.";
  if (input.keywords.length > WRITER_LIMITS.keywordsMax) {
    fieldErrors.keywords = `Keep keywords under ${WRITER_LIMITS.keywordsMax} characters.`;
  }
  if (input.instructions.length > WRITER_LIMITS.instructionsMax) {
    fieldErrors.instructions = `Keep instructions under ${WRITER_LIMITS.instructionsMax} characters.`;
  }

  return Object.keys(fieldErrors).length
    ? { ok: false, fieldErrors }
    : { ok: true, data: input as WriterInput };
}
