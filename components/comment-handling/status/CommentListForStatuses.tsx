// components/comments/CommentList.tsx
"use client";

import { useEffect, useState } from "react";
import CommentItem from "../status/CommentItem";
import { useSession } from "next-auth/react";
import { CommentDoc } from "@/lib/models/Comment";
import CommentInput from "../status/CommentInput";
import Lottie from "lottie-react";
import noComments from "@/public/lottie/make-comment.json";
import KarmaRewardToast from "@/components/karma/KarmaRewardToast";
import { useUserInfo } from "@/app/context/UserContext";
import { useFeed } from "@/app/context/UserFeedContext";

export default function CommentList({
  statusId,
  isAuthor,
  authorId,
  author,
}: {
  statusId: string;
  isAuthor: boolean;
  authorId: string;
  author: string;
}) {
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const { data: session } = useSession();
  const userId = session?.user.id;
  const { karmaScore, setKarmaScore, setRank } = useUserInfo();

  //we can determine isCommentOwner from here
  const [karmaReward, setKarmaReward] = useState<{
    label: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    async function fetchComments() {
      const res = await fetch(
        `/api/users/${statusId}/comments/status-comments/get-comments`,
      );
      const data = await res.json();
      setComments(data.comments);
    }
    fetchComments();
  }, [statusId]);

  async function handleReply(parentId: string, text: string) {
    const res = await fetch(
      `/api/users/${statusId}/comments/status-comments/add-comment`,
      {
        method: "POST",
        body: JSON.stringify({
          userId: userId, // TODO: get from session
          text,
          parentCommentId: parentId,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [comment, ...prev]);
      const updated = await fetch(
        `/api/users/${statusId}/comments/status-comments/get-comments`,
      );
      const data = await updated.json();
      setComments(data.comments);
    }
  }

  async function handleAddComment(text: string) {
    const res = await fetch(
      `/api/users/${statusId}/comments/status-comments/add-comment`,
      {
        method: "POST",
        body: JSON.stringify({
          userId: userId,
          text,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    if (res.ok) {
      const { rewardKarma, promotion, totalKarma } = await res.json();

      if (promotion?.newRank) {
        setRank(promotion.newRank);
      }

      if (typeof rewardKarma === "number" && rewardKarma > 0) {
        setKarmaReward({
          label: "Added Comment!",
          amount: rewardKarma,
        });
        setKarmaScore(totalKarma);
      }

      const updated = await fetch(
        `/api/users/${statusId}/comments/status-comments/get-comments`,
      );
      const data = await updated.json();
      setComments(data.comments);
      // feed.refresh?.();
    }
  }

  return (
    <div className="h-[50vh] overflow-x-hidden animate-slide-down">
      <h1 className="text-secondary my-2 text-center font-light">
        {comments.length} Comments
      </h1>
      <CommentInput onSubmit={handleAddComment} />
      <div className="mt-3">
        {/*TODO: wire up isCommentPinned to show comment at the top of the comment board */}
        {comments.map((comment) => (
          <CommentItem
            key={String(comment._id)}
            comment={comment}
            onReply={handleReply}
            parentUser={comment.commenter.username}
            isAuthor={isAuthor}
            isAuthorCommenting={
              String(comment.userId) === String(authorId) ? true : false
            }
            authorId={authorId}
            isCommentOwner={String(comment.userId) === String(userId)}
            userId={userId}
            statusId={statusId}
            author={author}
            isCommentPinned={!comment.pinned}
          />
        ))}
      </div>
      {comments.length === 0 && (
        <div className="flex flex-col justify-center items-center my-9">
          <Lottie animationData={noComments} style={{ width: "15rem" }} />
          <h1 className="z-10 text-secondary font-extralight tracking-tight">
            Be the first to comment!
          </h1>
        </div>
      )}
      <KarmaRewardToast
        open={!!karmaReward}
        label={karmaReward?.label ?? ""}
        amount={karmaReward?.amount ?? 0}
        onDone={() => setKarmaReward(null)}
      />
    </div>
  );
}
