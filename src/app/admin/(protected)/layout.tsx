export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ClientLayout from "./ClientLayout";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}