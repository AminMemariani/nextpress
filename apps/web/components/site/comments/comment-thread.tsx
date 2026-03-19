import type { CommentDto } from "@nextpress/core/comment/comment-types";
import DOMPurify from "isomorphic-dompurify";

/**
 * Server component: renders a threaded comment tree.
 * Only approved comments are passed in (filtered by commentService.getForEntry).
 */

interface Props {
  comments: CommentDto[];
  contentEntryId: string;
}

export function CommentThread({ comments, contentEntryId }: Props) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        No comments yet. Be the first to comment.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h3>
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} depth={0} />
      ))}
    </div>
  );
}

function CommentNode({ comment, depth }: { comment: CommentDto; depth: number }) {
  const maxIndent = 3;
  const indent = Math.min(depth, maxIndent);

  return (
    <div style={{ marginLeft: `${indent * 2}rem` }}>
      <div className="border-l-2 border-gray-200 pl-4 py-2">
        {/* Author */}
        <div className="flex items-center gap-2 mb-1">
          {comment.author.image && (
            <img
              src={comment.author.image}
              alt=""
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="font-medium text-sm">
            {comment.author.url ? (
              <a
                href={comment.author.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-blue-600 hover:underline"
              >
                {comment.author.name}
              </a>
            ) : (
              comment.author.name
            )}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Body */}
        <div
          className="text-sm text-gray-700 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(comment.body, {
              ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "code"],
              ALLOWED_ATTR: ["href"],
            }),
          }}
        />

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
