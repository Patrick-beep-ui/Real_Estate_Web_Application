export interface GeneratedContent {
  headline: string;
  subheadline: string;
  body_paragraphs: string[];
  bullets: string[];
  faqs: { q: string; a: string }[];
  before_title: string;
  before_body: string;
  after_title: string;
  after_body: string;
  warning_title: string;
  warning_body: string;
  urgency_line: string;
  final_cta_headline: string;
  final_cta_subline: string;
  meta_title: string;
  meta_description: string;
  why_tarek_body: string[];
  video_caption_lines: string[];
  sms_prefilled_text: string;
}
