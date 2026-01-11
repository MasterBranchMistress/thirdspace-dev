function getDefaultStartTime(minutesAhead = 15) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutesAhead);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`; // "HH:MM"
}
