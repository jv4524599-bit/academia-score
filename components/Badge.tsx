import { badgeClass, badgeText, type StatusStr } from '@/lib/gym-helpers';

export function Badge({ label, status, nivel }: { label: string; status: StatusStr; nivel?: string | null }) {
  return <span className={`badge ${badgeClass(status)}`}>{badgeText(label, status, nivel)}</span>;
}
