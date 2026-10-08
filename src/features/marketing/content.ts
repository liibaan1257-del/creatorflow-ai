import type { ComponentType } from "react";
import {
  BriefcaseIcon,
  CoinsIcon,
  FileTextIcon,
  FolderIcon,
  ImageIcon,
  MegaphoneIcon,
  PenIcon,
  ShieldIcon,
  StoreIcon,
  TemplateIcon,
  VideoIcon,
  type IconProps,
} from "@/components/ui/icons";

/**
 * Landing page copy, kept separate from layout so marketing text can change
 * without touching components. `status` keeps the page honest about what is
 * live today versus in development.
 */

type Icon = ComponentType<IconProps>;
export type Availability = "available" | "coming-soon";

export type Feature = {
  title: string;
  description: string;
  icon: Icon;
  status: Availability;
};

export const features: readonly Feature[] = [
  {
    title: "AI Writer",
    description:
      "Turn a topic or rough outline into blog posts, video scripts and social captions in your own tone of voice.",
    icon: PenIcon,
    status: "available",
  },
  {
    title: "AI Image Generator",
    description:
      "Create thumbnails, featured images and social graphics from a short text description.",
    icon: ImageIcon,
    status: "coming-soon",
  },
  {
    title: "Content Workspace",
    description:
      "Keep every draft, image and idea in one organised place, ready to edit, reuse and publish.",
    icon: FolderIcon,
    status: "available",
  },
  {
    title: "Templates",
    description:
      "Start from proven structures for listicles, how-to guides, product descriptions and more.",
    icon: TemplateIcon,
    status: "available",
  },
  {
    title: "Credit System",
    description:
      "Simple, transparent usage: each generation uses credits, so you always know what you're spending.",
    icon: CoinsIcon,
    status: "available",
  },
  {
    title: "Secure Account",
    description:
      "Email sign-in with verification and password reset. Your workspace is private to you, protected by row-level security.",
    icon: ShieldIcon,
    status: "available",
  },
];

export const steps = [
  {
    title: "Create your free account",
    description: "Sign up with your email in under a minute. No credit card required.",
  },
  {
    title: "Describe what you need",
    description: "Pick a template or start blank, then add your topic, audience and tone.",
  },
  {
    title: "Generate, edit and publish",
    description: "Refine the result in your workspace, then copy it wherever you publish.",
  },
] as const;

export type UseCase = { title: string; description: string; icon: Icon; examples: readonly string[] };

export const useCases: readonly UseCase[] = [
  {
    title: "Bloggers",
    description: "Go from idea to a structured, SEO-friendly draft without the blank page.",
    icon: FileTextIcon,
    examples: ["Article outlines", "Full blog drafts", "Meta descriptions"],
  },
  {
    title: "YouTubers",
    description: "Plan videos faster with hooks, scripts and eye-catching thumbnails.",
    icon: VideoIcon,
    examples: ["Video scripts", "Titles & descriptions", "Thumbnail images"],
  },
  {
    title: "Social media creators",
    description: "Keep a consistent posting schedule across every platform.",
    icon: MegaphoneIcon,
    examples: ["Captions", "Post ideas", "Hashtag sets"],
  },
  {
    title: "Freelancers",
    description: "Deliver more client work in less time, without cutting corners.",
    icon: BriefcaseIcon,
    examples: ["Client copy", "Proposals", "Repurposed content"],
  },
  {
    title: "Small businesses",
    description: "Market your business professionally without hiring an agency.",
    icon: StoreIcon,
    examples: ["Product descriptions", "Newsletters", "Promotions"],
  },
];

export type Plan = {
  name: string;
  description: string;
  /** Only shown for plans you can actually sign up for today. */
  price?: string;
  status: Availability;
  highlights: readonly string[];
  featured?: boolean;
};

export const plans: readonly Plan[] = [
  {
    name: "Free",
    description: "Everything you need to get started during early access.",
    price: "$0",
    status: "available",
    highlights: [
      "Secure personal account",
      "Private content workspace",
      "20 free credits to get started",
    ],
    featured: true,
  },
  {
    name: "Pro",
    description: "For creators who publish every week.",
    status: "coming-soon",
    highlights: ["More monthly credits", "All templates", "AI images"],
  },
  {
    name: "Business",
    description: "For freelancers and teams creating for clients.",
    status: "coming-soon",
    highlights: ["Highest credit allowance", "Priority generation", "Team features"],
  },
];

export const faqs = [
  {
    question: "Is CreatorFlow AI free to use?",
    answer:
      "Yes. You can create a free account today. Paid plans with more credits will be introduced later, and we'll announce pricing before anything changes for you.",
  },
  {
    question: "What can I do with CreatorFlow AI right now?",
    answer:
      "You can write blog posts, outlines, YouTube scripts, titles and descriptions, social posts, SEO copy and product descriptions with the AI Writer, start from ready-made templates, and keep everything in your project workspace. The AI Image Generator is coming soon.",
  },
  {
    question: "How do credits work?",
    answer:
      "Each AI generation uses credits depending on its size: 1 credit for a title or caption, up to 5 for a full blog post. Your balance is always visible, and failed generations are never charged.",
  },
  {
    question: "Who owns the content I create?",
    answer:
      "You do. Content you create in your workspace is yours to edit, publish and use commercially.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your account uses verified email sign-in, and your workspace data is protected with database row-level security so only you can access it. Secret keys never reach your browser.",
  },
  {
    question: "Do I need any technical skills?",
    answer:
      "No. If you can describe what you want to write, you can use CreatorFlow AI. It works in any modern browser on desktop, tablet and mobile.",
  },
] as const;
