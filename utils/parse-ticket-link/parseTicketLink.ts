export function parseTicketLink(ticketLink: string) {
  try {
    if (typeof ticketLink !== "string") {
      throw new Error("The ticket link must be  string");
    }
    const link = ticketLink.trim();
    const parsedLink = new URL(link);
    if (!parsedLink) {
      throw new Error("Invalid Link");
    }
    const hostName = parsedLink.host.toLowerCase();
    if (hostName.includes("eventbrite")) return "/misc/eventbrite-logo.png";
    if (hostName.includes("seatgeek")) return "/misc/seatgeek-logo.svg";
    if (hostName.includes("ticketmaster")) return "/misc/ticketmaster-logo.png";
    if (hostName.includes("bandsintown")) return "/misc/bit-logo.png";
    if (hostName.includes("dice")) return "/misc/dice-logo.png";
    if (hostName.includes("axs")) return "/misc/axs-logo.webp";
  } catch (err) {
    return "/favicon.ico";
  }
}
