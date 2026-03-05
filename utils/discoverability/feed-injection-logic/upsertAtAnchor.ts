export function upsertAtAnchor<T extends { id: string }>(
  items: T[],
  moduleItem: T,
  anchorIndex: number,
) {
  const existingIndex = items.findIndex((x) => x.id === moduleItem.id);

  // remove existing
  const without =
    existingIndex >= 0
      ? items.filter((_, i) => i !== existingIndex)
      : [...items];

  // clamp index
  const idx = Math.max(0, Math.min(anchorIndex, without.length));

  // insert at anchor
  const next = [...without];
  next.splice(idx, 0, moduleItem);
  return next;
}
