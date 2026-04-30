// Format Indian rupees compactly: 230000 -> ₹2.3L
export function formatINR(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

export function formatLPA(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `${amount} LPA`;
}

// Deterministic gradient for college from name
const palettes: [string, string][] = [
  ["#F59E0B", "#B45309"],
  ["#3B82F6", "#1E3A8A"],
  ["#10B981", "#065F46"],
  ["#EC4899", "#831843"],
  ["#8B5CF6", "#4C1D95"],
  ["#EF4444", "#7F1D1D"],
  ["#14B8A6", "#134E4A"],
  ["#F97316", "#7C2D12"],
];

export function collegeGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const [a, b] = palettes[hash % palettes.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function collegeInitials(name: string): string {
  const cleaned = name.replace(/\b(of|and|the|for)\b/gi, "");
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts.slice(0, 3).map((p) => p[0]).join("").toUpperCase();
}
