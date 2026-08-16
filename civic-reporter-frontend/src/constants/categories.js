export const CATEGORIES = [
  { value: "pothole", label: "Pothole", icon: "⛝" },
  { value: "streetlight", label: "Streetlight", icon: "⌁" },
  { value: "garbage", label: "Garbage", icon: "▦" },
  { value: "water", label: "Water", icon: "≋" },
  { value: "electrical", label: "Electrical hazard", icon: "⚡" },
  { value: "other", label: "Other", icon: "◈" },
];

export const STATUS_META = {
  pending: { label: "Pending", color: "hazard" },
  "in-progress": { label: "In progress", color: "route" },
  resolved: { label: "Resolved", color: "signal" },
};

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label || value;
