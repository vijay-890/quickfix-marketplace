// Tanglish: Search text-la regex special characters safe-a escape pannum.

export default function escapeRegex(value, maxLength = 120) {
  return String(value)
    .slice(0, maxLength)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
