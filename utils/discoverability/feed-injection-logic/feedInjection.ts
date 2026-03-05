export function insertFeedItemAt<T>(arr: T[], index: number, item: T) {
  const copy = [...arr];
  const i = Math.max(0, Math.min(index, copy.length));
  copy.splice(i, 0, item);
  return copy;
}
