import { ObjectId } from "mongodb";

// Mongo collection names
export const DBS = {
  _THIRDSPACE: "thirdspace",
};
export const COLLECTIONS = {
  _USERS: "users",
  _EVENTS: "events",
  _USER_FEED: "user_feed",
  _EVENT_FEED: "event_feed",
  _USER_STATUSES: "user_statuses",
};

// event statuses
export const EVENT_STATUSES = {
  _ACTIVE: "active",
  _CANCELED: "canceled",
  _COMPLETED: "completed",
  _REMOVED: "removed",
  _UPDATED: "updated",
  _RECEIVED_FRIEND_REQUEST: "received_friend_request",
  _ACCEPTED_FRIEND_REQUEST: "accepted_friend_request",
  _BLOCKED_USER_JOINED_EVENT: "blocked_user_joined_event",
  _USER_LEFT_EVENT: "user_left_event",
};

export const USER_RANKING = {
  _BRONZE: "bronze",
  _SILVER: "silver",
  _GOLD: "gold",
  _PLATINUM: "platinum",
  _ADMIN: "admin",
};

// Example: user providers
export const AUTH_PROVIDERS = {
  _LOCAL: "local",
  _GOOGLE: "google",
  _FACEBOOK: "facebook",
  _X: "x",
};

export const TEST_IDS = {
  _HOST_ID: new ObjectId("6897e4df3faf593cc25870bb"),
  _OTHER_IDS: [
    new ObjectId("6897e5b73faf593cc25870bd"),
    new ObjectId("689ac7a40e02bc8bc9dc07fd"),
    new ObjectId("689acb8f0e02bc8bc9dc0a3e"),
    new ObjectId("689acb940e02bc8bc9dc0a3f"),
    new ObjectId("689acb950e02bc8bc9dc0a40"),
  ],
};

//ref for models
export const REF = {
  _EVENT: "Event",
  _USER: "User",
  _FEED: "Feed",
};

export const FEED_BUTTON_DROPDOWN_OPTIONS = {
  items: [
    {
      key: "report",
      label: "Report",
    },
    {
      key: "hide",
      label: "Hide",
    },
    {
      key: "block",
      label: "Block User",
    },
    {
      key: "delete",
      label: "Delete file",
    },
  ],
};
