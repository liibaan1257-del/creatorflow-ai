import type { ComponentType } from "react";
import {
  FileTextIcon,
  InstagramIcon,
  MessageIcon,
  PenIcon,
  SearchIcon,
  TagIcon,
  VideoIcon,
  type IconProps,
} from "@/components/ui/icons";
import type { Tone, WriterType } from "@/features/writer/config";

/**
 * Template library. Templates are static product content (the same for every
 * user, versioned with the code), so they live here rather than in a database
 * table: no queries, no migrations, type-checked against the AI Writer.
 *
 * A template pre-configures the AI Writer: content type, tone and the
 * instructions that shape the output. Users can still edit everything.
 */

export const TEMPLATE_CATEGORIES = ["Blog", "YouTube", "Social", "SEO", "E-commerce"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export type Template = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: ComponentType<IconProps>;
  /** AI Writer content type this template uses. */
  writerType: WriterType;
  tone: Tone;
  /** Prefilled "Additional instructions" (max 1000 characters). */
  instructions: string;
  /** Example topic shown as the placeholder. */
  topicExample: string;
};

export const TEMPLATES: readonly Template[] = [
  {
    id: "blog-post",
    name: "Blog Post",
    description: "A complete, SEO-friendly article with a hook, clear sections and a conclusion.",
    category: "Blog",
    icon: PenIcon,
    writerType: "blog_post",
    tone: "friendly",
    instructions:
      "Write for beginners. Use short paragraphs, practical examples and actionable tips. End with a clear takeaway.",
    topicExample: "How to start a profitable side hustle as a student",
  },
  {
    id: "blog-outline",
    name: "Blog Outline",
    description: "A structured outline with headings and key points to write from.",
    category: "Blog",
    icon: FileTextIcon,
    writerType: "blog_outline",
    tone: "professional",
    instructions:
      "Include a suggested meta title, the target reader, and 2–3 talking points under each heading. Suggest where examples or data would strengthen the post.",
    topicExample: "The complete guide to email marketing for small businesses",
  },
  {
    id: "youtube-script",
    name: "YouTube Script",
    description: "A full video script with a strong hook, sections and a call to action.",
    category: "YouTube",
    icon: VideoIcon,
    writerType: "youtube_script",
    tone: "casual",
    instructions:
      "Hook viewers in the first 15 seconds with a question or bold promise. Keep sentences short and easy to say out loud. Add a mid-video reminder to subscribe.",
    topicExample: "5 budget phone photography tricks that look professional",
  },
  {
    id: "youtube-description",
    name: "YouTube Description",
    description: "A searchable description with chapters, links section and hashtags.",
    category: "YouTube",
    icon: VideoIcon,
    writerType: "youtube_description",
    tone: "friendly",
    instructions:
      "Put the main keyword in the first sentence. Include placeholder lines for social links and recommended videos.",
    topicExample: "Beginner home workout with no equipment",
  },
  {
    id: "youtube-title",
    name: "YouTube Title",
    description: "Five click-worthy, honest title options under 70 characters.",
    category: "YouTube",
    icon: VideoIcon,
    writerType: "youtube_title",
    tone: "persuasive",
    instructions:
      "Mix formats: one number list, one how-to, one question, one curiosity gap and one result-focused title. No misleading clickbait.",
    topicExample: "How I grew my channel to 10,000 subscribers",
  },
  {
    id: "instagram-caption",
    name: "Instagram Caption",
    description: "A scroll-stopping caption with line breaks, emojis and hashtags.",
    category: "Social",
    icon: InstagramIcon,
    writerType: "social_post",
    tone: "casual",
    instructions:
      "Write for Instagram: a strong first line (it shows before 'more'), short lines with line breaks, a few relevant emojis, a question to drive comments, and 8–12 hashtags on the last line.",
    topicExample: "Behind the scenes of our new coffee menu launch",
  },
  {
    id: "facebook-post",
    name: "Facebook Post",
    description: "A conversational post that sparks comments and shares.",
    category: "Social",
    icon: MessageIcon,
    writerType: "social_post",
    tone: "friendly",
    instructions:
      "Write for Facebook: conversational and community-focused, 80–150 words, a relatable opening, a clear call to action, and at most 3 hashtags.",
    topicExample: "Announcing our weekend discount for loyal customers",
  },
  {
    id: "seo-meta-description",
    name: "SEO Meta Description",
    description: "Three meta descriptions under 160 characters that earn the click.",
    category: "SEO",
    icon: SearchIcon,
    writerType: "meta_description",
    tone: "professional",
    instructions:
      "Front-load the primary keyword, state the page's unique value, and end with an action verb (Learn, Discover, Get).",
    topicExample: "Online accounting course for freelancers",
  },
  {
    id: "product-description",
    name: "Product Description",
    description: "Benefit-led product copy that answers objections and converts.",
    category: "E-commerce",
    icon: TagIcon,
    writerType: "product_description",
    tone: "persuasive",
    instructions:
      "Focus on benefits over features, address one common objection, and keep it scannable. Use only details from the topic; do not invent specifications.",
    topicExample: "Handmade leather laptop sleeve, 14-inch, water resistant",
  },
];

export function getTemplate(id: string | undefined | null): Template | undefined {
  return id ? TEMPLATES.find((template) => template.id === id) : undefined;
}

