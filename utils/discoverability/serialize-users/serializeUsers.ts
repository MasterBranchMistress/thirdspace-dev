import { ObjectId } from "mongoose";

export function serializeNearbyUser(u: any) {
  return {
    id: String(u._id),
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.username,
    avatar: u.avatar,
    followers: Array.isArray(u.followers)
      ? u.followers.map((id: ObjectId) => String(id))
      : [],
    following: Array.isArray(u.following)
      ? u.following.map((id: ObjectId) => String(id))
      : [],
    friends: Array.isArray(u.friends)
      ? u.friends.map((id: ObjectId) => String(id))
      : [],
    tags: Array.isArray(u.tags) ? u.tags : [],
    bio: u.bio,
    location: u.location,
    distanceMeters: u.distanceMeters,
    sharedTags: Array.isArray(u.sharedTags) ? u.sharedTags : [],
    sharedCount: u.sharedCount ?? 0,
    qualityBadge: u.qualityBadge,
    karmaScore: u.karmaScore,
  };
}
