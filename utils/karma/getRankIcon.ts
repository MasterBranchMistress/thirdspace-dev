export function getRankMeta(rank?: string) {
  const normalized = rank?.trim().toLowerCase();

  switch (normalized) {
    case "luminary":
      return {
        label: "Luminary",
        icon: "/icons/stars.png",
        className:
          "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white shadow-xl shadow-fuchsia-500/50 text-tiny",
      };

    case "pioneer":
      return {
        label: "Pioneer",
        icon: "/icons/rocket.png",
        className:
          "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-lg shadow-cyan-400/30 text-tiny",
      };

    case "connector":
      return {
        label: "Connector",
        icon: "/icons/galaxy.png",
        className:
          "bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white shadow-lg shadow-yellow-400/40 text-tiny",
      };

    case "navigator":
      return {
        label: "Navigator",
        icon: "/icons/compass.png",
        className:
          "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/30 text-tiny",
      };

    case "explorer":
      return {
        label: "Explorer",
        icon: "/icons/telescope.png",
        className:
          "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white text-tiny",
      };

    case "drifter":
    default:
      return {
        label: "Drifter",
        icon: "/icons/comet.png",
        className:
          "bg-gradient-to-r from-indigo-400 to-purple-500 text-white  text-tiny",
      };
  }
}
