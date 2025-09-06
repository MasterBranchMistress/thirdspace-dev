// components/comments/CommentList.tsx
"use client";

import { useEffect, useState } from "react";
import CommentItem from "./CommentItem";
import { useSession } from "next-auth/react";
import { CommentDoc } from "@/lib/models/Comment";
import CommentInput from "./CommentInput";
import Lottie from "lottie-react";
import noComments from "@/public/lottie/make-comment.json";

export default function CommentList({
  eventId,
  isHost,
  hostId,
  eventHost,
}: {
  eventId: string;
  isHost: boolean;
  hostId: string;
  eventHost: string;
}) {
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const { data: session } = useSession();
  const userId = session?.user.id;

  //we can determine isCommentOwner from here

  useEffect(() => {
    async function fetchComments() {
      const res = await fetch(`/api/users/${eventId}/get-comments`);
      const data = await res.json();
      setComments(data.comments);
    }
    fetchComments();
  }, [eventId]);

  async function handleReply(parentId: string, text: string) {
    const res = await fetch(`/api/users/${eventId}/add-comment`, {
      method: "POST",
      body: JSON.stringify({
        userId: userId, // TODO: get from session
        text,
        parentCommentId: parentId,
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [comment, ...prev]);
      const updated = await fetch(`/api/users/${eventId}/get-comments`);
      const data = await updated.json();
      setComments(data.comments);
    }
  }

  async function handleAddComment(text: string) {
    const res = await fetch(`/api/users/${eventId}/add-comment`, {
      method: "POST",
      body: JSON.stringify({
        userId: userId,
        text,
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [comment, ...prev]);
      const updated = await fetch(`/api/users/${eventId}/get-comments`);
      const data = await updated.json();
      setComments(data.comments);
    }
  }

  console.log("Event: ", eventId);

  return (
    <>
      <CommentInput onSubmit={handleAddComment} />
      <h1 className="text-primary mt-3 text-center font-light">
        {comments.length} Comments
      </h1>
      <div className="mt-3">
        {/*TODO: wire up isCommentPinned to show comment at the top of the comment board */}
        {comments.map((comment) => (
          <CommentItem
            key={String(comment._id)}
            comment={comment}
            onReply={handleReply}
            parentUser={comment.commenter.username}
            isHost={isHost}
            isHostCommenting={
              String(comment.userId) === String(hostId) ? true : false
            }
            hostId={hostId}
            isCommentOwner={String(comment.userId) === String(userId)}
            userId={userId}
            eventId={eventId}
            eventHost={eventHost}
            isCommentPinned={!comment.pinned}
          />
        ))}
      </div>
      {comments.length === 0 && (
        <div className="flex flex-col justify-center items-center my-9">
          <Lottie animationData={noComments} style={{ width: "15rem" }} />
          <h1 className="z-10 text-primary font-extralight tracking-tight">
            Be the first to comment!
          </h1>
        </div>
      )}
    </>
  );
}
