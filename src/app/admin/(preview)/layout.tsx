export const dynamic = 'force-dynamic';
export const revalidate = 0;

import PreviewClientLayout from "./PreviewClientLayout";

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <PreviewClientLayout>{children}</PreviewClientLayout>;
}
