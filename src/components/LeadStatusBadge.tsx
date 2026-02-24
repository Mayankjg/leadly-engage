const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-status-new/15 text-status-new" },
  contacted: { label: "Contacted", className: "bg-status-contacted/15 text-status-contacted" },
  qualified: { label: "Qualified", className: "bg-status-qualified/15 text-status-qualified" },
  proposal: { label: "Proposal", className: "bg-status-proposal/15 text-status-proposal" },
  won: { label: "Won", className: "bg-status-won/15 text-status-won" },
  lost: { label: "Lost", className: "bg-status-lost/15 text-status-lost" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.new;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
