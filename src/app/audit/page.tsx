import { AuditSummaryView } from "./audit-summary-view";

export const metadata = {
  title: "Audit Summary | Gwinnett IFTA Snap-Audit",
};

export default function AuditPage() {
  return (
    <main className="min-h-screen p-4 pb-10">
      <AuditSummaryView />
    </main>
  );
}
