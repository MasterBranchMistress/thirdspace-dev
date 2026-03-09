export type SessionUser = {
  id: string;
  firstName: string;
  lastName: String;
  username: string;
  email: string;
  avatar?: string;
  interests?: string[];
  favoriteLocations?: string[];
  provider?: string;
  isAdmin?: boolean;
  karmaScore?: number;
  qualityBadge?:
    | "drifter"
    | "explorer"
    | "navigator"
    | "connector"
    | "pioneer"
    | "luminary";
  eventsAttended?: number;
  eventsHosted?: number;
  lastMinuteCancels?: number;
  bio?: string;
  tags?: string[];
  location?: {
    name: string;
    lat?: number;
    lng?: number;
  };
  lang?: string;
  onboarding?: {
    exploredSolarSystem?: boolean;
    exploredSpaceStation?: boolean;
    reviewedPrivacy?: boolean;
    addedInterests?: boolean;
    completed?: boolean;
  };
};
