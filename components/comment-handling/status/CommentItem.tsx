// components/comments/CommentItem.tsx
"use client";

import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  Button,
  Form,
  Input,
} from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import Lottie from "lottie-react";
import { useEffect, useMemo, useRef, useState } from "react";
import send from "@/public/lottie/send.json";
import {
  ChevronDoubleRightIcon,
  FireIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { CommentDoc } from "@/lib/models/Comment";
import CommentActions from "./CommentActions";
import { useToast } from "@/app/providers/ToastProvider";
import { useRouter } from "next/navigation";

type Props = {
  comment: CommentDoc;
  onReply: (parentId: string, text: string) => void;
  depth?: number;
  parentUser?: string;
  isAuthor?: boolean;
  author?: string;
  authorId?: string;
  statusId?: string;
  isAuthorCommenting?: boolean;
  isCommentOwner?: boolean;
  isCommentPinned?: boolean;
  userId?: string;
};

export default function CommentItem({
  comment,
  onReply,
  depth = 0,
  parentUser,
  isAuthor,
  authorId,
  statusId,
  author,
  isAuthorCommenting,
  isCommentOwner,
  isCommentPinned,
  userId,
}: Props) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isDeleted, setIsDeleted] = useState(comment.deleted ?? false);
  const [isEditing, setIsEditing] = useState(false);
  // const [commentPinned, setCommentPinned] = useState(comment.pinned);
  const [commentPinned, setCommentPinned] = useState(!!comment.pinned);
  const [textToInsertOnEdit, setTextToInsertOnEdit] = useState(comment.text);
  const lottieRef = useRef<any>(null);
  const { notify } = useToast();
  const router = useRouter();

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/status/${statusId}/delete-comment`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
        }),
      });
      if (res.ok) {
        setIsDeleted(true);
        notify(
          "Comment Deleted 🚮",
          "Orbiters will no longer be able to see this comment.",
        );
      } else {
        setIsDeleted(false);
      }
    } catch (err) {
      setIsDeleted(false);
      return err;
    }
  };

  const editComment = async (commentId: string) => {
    const oldText = comment.text;
    try {
      const res = await fetch(`/api/status/${statusId}/edit-comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          text: textToInsertOnEdit,
        }),
      });
      if (res.ok) {
        comment.text = textToInsertOnEdit;
        comment.editedAt = new Date();
        setIsEditing(false);
        setTextToInsertOnEdit("");
      } else {
        comment.text = oldText;
      }
    } catch (err: any) {
      comment.text = oldText;
      notify("Unable to edit comment 😢", err);
      return err;
    }
  };

  const pinComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/status/${statusId}/handle-comment-pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
        }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      setCommentPinned(false);
      notify("Couldn't pin comment 😬", err as any);
      return err;
    }
  };

  //so default value only renders on first try.
  // here we use a useEffect to reseed the hook with our current edit state
  //so react knows whats going on
  useEffect(() => {
    setCommentPinned(!!comment.pinned);
  }, [comment.pinned]);

  const commentIsDirty = textToInsertOnEdit.trim() !== comment.text.trim();

  return (
    <div className={`${depth === 0 ? "pl-3 mt-6" : ""} my-1 `}>
      {/* badge here */}
      <div
        className={`flex items-start gap-2 bg-transparent backdrop-blur-2xl text-secondary`}
      >
        <Avatar
          src={comment.commenter.avatar}
          size="md"
          isBordered
          color="primary"
          className="mr-1"
          onClick={() =>
            router.push(`/dashboard/profile/${comment.commenter.userId}`)
          }
        />

        <div className="flex-1">
          {/* Row 1: header */}
          <div className={`flex justify-between items-start`}>
            <div className="flex flex-col">
              <p className="font-medium text-secondary text-sm">
                @{comment.commenter.username}{" "}
                <span className="text-xs tracking-tight font-light ml-1 text-white/70">
                  {formatDistanceToNow(new Date(comment.timestamp))} ago
                </span>
              </p>
              {/* Row 2: text */}
              <div className="text-xs text-secondary mt-1">
                {depth !== 0 && parentUser && (
                  <span className="text-orchid font-extrabold mr-1">
                    @{parentUser}
                  </span>
                )}
                {isDeleted ? (
                  <span className="italic text-secondary/80">
                    This comment was deleted
                  </span>
                ) : !isEditing ? (
                  <p>
                    {comment.text}{" "}
                    {comment.editedAt && (
                      <span className="italic text-secondary/60">(edited)</span>
                    )}
                  </p>
                ) : (
                  <>
                    <Form
                      className="mt-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        editComment(String(comment._id));
                      }}
                    >
                      <div className="flex flex-1 flex-row gap-3 items-center justify-center">
                        <Input
                          variant="underlined"
                          color="primary"
                          defaultValue={textToInsertOnEdit}
                          value={textToInsertOnEdit}
                          onValueChange={setTextToInsertOnEdit}
                          placeholder={comment.text}
                          classNames={{
                            input: "text-sm text-secondary",
                            innerWrapper: "p-0",
                            base: "text-secondary",
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              editComment(String(comment._id));
                            }
                          }}
                        ></Input>

                        <button
                          disabled={!commentIsDirty}
                          onClick={(e) => {
                            e.preventDefault();
                            editComment(String(comment._id));
                          }}
                          className={`transition-opacity ${!commentIsDirty ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <PaperAirplaneIcon
                            width={20}
                            className="text-secondary"
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setIsEditing(false);
                          }}
                        >
                          <XMarkIcon width={25} className="text-secondary" />
                        </button>
                      </div>
                    </Form>
                  </>
                )}
              </div>
            </div>
            {!isDeleted ? (
              <CommentActions
                comment={comment}
                editing={isEditing}
                onPressCancelEdit={() => setIsEditing(false)}
                onPressEdit={() => setIsEditing(true)}
                onDelete={() => deleteComment(String(comment._id))}
                onPin={() => {
                  !commentPinned;
                  setCommentPinned((p) => !p);
                  pinComment(String(comment._id));
                }}
                isAuthor={isAuthor!}
                isCommentOwner={isCommentOwner!}
                isCommentPinned={!!comment.pinned}
              />
            ) : null}
          </div>

          {/* Row 3: reactions */}
          <div className="flex flex-row gap-2 mt-2">
            <div className="flex flex-row gap-1 items-center">
              <HandThumbUpIcon width={18} className="text-white" />
              <span className="text-white text-sm">{comment.likes}</span>
            </div>
            <div className="flex flex-row gap-1 items-center">
              <FireIcon width={18} className="text-white" />
              <span className="text-white text-sm">{comment.sparks}</span>
            </div>
            <button
              hidden={comment.deleted}
              className="text-white text-xs ml-1"
              onClick={() => setReplying(!replying)}
            >
              {replying ? `Cancel` : `Reply`}
            </button>
            {commentPinned === true && (
              <div className="flex flex-row gap-2 items-center justify-center">
                <h1 className="text-xs text-gray-400 tracking-tight italic">
                  Pinned by {author} 📌
                </h1>
              </div>
            )}
          </div>
        </div>
      </div>
      {replying && (
        <div className="flex flex-row gap-3 mt-3 justify-center items-center">
          <Input
            value={replyText}
            color="secondary"
            variant="underlined"
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full text-secondary p-2 text-sm"
            placeholder={`@${comment.commenter.username}`}
            classNames={{
              input: "text-white placeholder:text-white/80",
              inputWrapper: "bg-transparent",
            }}
          />
          <button
            onClick={() => {
              onReply(String(comment._id), replyText);
              setReplyText("");
              setReplying(false);
            }}
          >
            <PaperAirplaneIcon width={25} className="text-secondary mr-6" />
          </button>
        </div>
      )}
      {/* Recursive replies */}
      {comment.replies &&
        comment.replies.length > 0 &&
        (depth < 1 ? (
          <Accordion
            className="ml-3"
            itemClasses={{
              title: "text-secondary",
            }}
          >
            <AccordionItem
              key={`replies-${comment._id}`}
              aria-label="Replies"
              title={`• ${comment.replies.length} ${
                comment.replies.length === 1 ? "Reply" : "Replies"
              }`}
              indicator={
                <ChevronDoubleRightIcon
                  width={18}
                  className="text-secondary mt-1 transition-transform data-[open=true]:rotate-90"
                />
              }
              classNames={{
                title: "text-secondary font-medium text-xs mt-0.5",
                indicator: "hidden",
              }}
              startContent={
                <Avatar
                  src={comment.replies[0].commenter.avatar}
                  size="sm"
                  isBordered
                  color="primary"
                />
              }
            >
              <div className="flex flex-col gap-2">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={String(reply._id)}
                    comment={reply}
                    onReply={onReply}
                    depth={depth + 1}
                    parentUser={comment.commenter.username}
                    isAuthorCommenting={
                      String(reply.userId) === String(authorId)
                    }
                    isAuthor={isAuthor!}
                    statusId={statusId}
                    author={author}
                    isCommentOwner={String(reply.userId) === String(userId)}
                    isCommentPinned={isCommentPinned!}
                  />
                ))}
              </div>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="mt-3 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={String(reply._id)}
                comment={reply}
                onReply={onReply}
                depth={depth + 1}
                parentUser={comment.commenter.username}
                isAuthor={isAuthor!}
                statusId={statusId}
                author={author}
                isCommentOwner={String(reply.userId) === String(userId)}
                isCommentPinned={isCommentPinned!}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
