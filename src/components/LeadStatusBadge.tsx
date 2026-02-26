const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "New Lead", className: "bg-status-new/15 text-status-new" },
  contacted: { label: "Contacted", className: "bg-status-contacted/15 text-status-contacted" },
  interested: { label: "Interested", className: "bg-[hsl(170,60%,45%)]/15 text-[hsl(170,60%,45%)]" },
  qualified: { label: "Qualified", className: "bg-status-qualified/15 text-status-qualified" },
  follow_up: { label: "Follow-Up", className: "bg-status-qualified/15 text-status-qualified" },
  proposal: { label: "Proposal Sent", className: "bg-status-proposal/15 text-status-proposal" },
  proposal_sent: { label: "Proposal Sent", className: "bg-status-proposal/15 text-status-proposal" },
  negotiation: { label: "Negotiation", className: "bg-[hsl(30,80%,50%)]/15 text-[hsl(30,80%,50%)]" },
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
