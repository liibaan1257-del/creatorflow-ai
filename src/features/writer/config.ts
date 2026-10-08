/**
 * AI Writer options, shared by the form (client) and the API (server).
 * Credit prices here are for DISPLAY ONLY: the database function
 * public.generation_cost() is the source of truth when credits are spent.
 */

import { CREDIT_COSTS } from "@/config/credits";

export const WRITER_TYPES = [
  {
    id: "blog_post",
    label: "Blog Post",
    description: "A complete, structured article",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 16000,
  },
  {
    id: "blog_outline",
    label: "Blog Outline",
    description: "Headings and key points to write from",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 8000,
  },
  {
    id: "social_post",
    label: "Social Media Post",
    description: "A ready-to-publish post with hashtags",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 4000,
  },
  {
    id: "youtube_title",
    label: "YouTube Title",
    description: "Five click-worthy title options",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 4000,
  },
  {
    id: "youtube_description",
    label: "YouTube Description",
    description: "Description with chapters and links section",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 6000,
  },
  {
    id: "youtube_script",
    label: "YouTube Script",
    description: "Hook, sections and call to action",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 12000,
  },
  {
    id: "seo_title",
    label: "SEO Title",
    description: "Five search-optimised page titles",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 4000,
  },
  {
    id: "meta_description",
    label: "Meta Description",
    description: "Three meta descriptions under 160 characters",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 4000,
  },
  {
    id: "product_description",
    label: "Product Description",
    description: "Benefit-led copy for a product page",
    credits: CREDIT_COSTS.writer,
    maxOutputTokens: 4000,
  },
] as const;

export type WriterType = (typeof WRITER_TYPES)[number]["id"];

export const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "persuasive", label: "Persuasive" },
] as const;

export type Tone = (typeof TONES)[number]["value"];

export const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Somali", label: "Somali (Soomaali)" },
  { value: "Arabic", label: "Arabic (العربية)" },
  { value: "French", label: "French (Français)" },
  { value: "Spanish", label: "Spanish (Español)" },
  { value: "Portuguese", label: "Portuguese (Português)" },
  { value: "German", label: "German (Deutsch)" },
  { value: "Italian", label: "Italian (Italiano)" },
  { value: "Dutch", label: "Dutch (Nederlands)" },
  { value: "Turkish", label: "Turkish (Türkçe)" },
  { value: "Swahili", label: "Swahili (Kiswahili)" },
  { value: "Hindi", label: "Hindi (हिन्दी)" },
] as const;

export type Language = (typeof LANGUAGES)[number]["value"];

export const WRITER_LIMITS = {
  topicMin: 3,
  topicMax: 2000,
  keywordsMax: 300,
  instructionsMax: 1000,
} as const;

export function getWriterType(id: string) {
  return WRITER_TYPES.find((type) => type.id === id);
}
