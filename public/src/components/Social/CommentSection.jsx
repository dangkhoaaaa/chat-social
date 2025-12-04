import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { getCommentsRoute, createCommentRoute, likeCommentRoute } from "../../utils/APIRoutes";
import { HiHeart, HiOutlineHeart } from "react-icons/hi";
import { toast } from "react-toastify";

export default function CommentSection({ postId, currentUser, socket, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (socket?.current) {
      socket.current.on("new-comment", ({ postId: commentPostId, comment }) => {
        if (commentPostId === postId) {
          setComments((prev) => [comment, ...prev]);
          if (onCommentAdded) onCommentAdded();
        }
      });

      socket.current.on("comment-like-update", ({ commentId, userId, isLiked }) => {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment._id === commentId) {
              if (isLiked) {
                return {
                  ...comment,
                  likes: [...comment.likes, userId],
                };
              } else {
                return {
                  ...comment,
                  likes: comment.likes.filter((id) => id.toString() !== userId),
                };
              }
            }
            return comment;
          })
        );
      });

      return () => {
        socket.current.off("new-comment");
        socket.current.off("comment-like-update");
      };
    }
  }, [socket, postId, onCommentAdded]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getCommentsRoute}/${postId}`);
      if (response.data.status) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(createCommentRoute, {
        postId,
        authorId: currentUser._id,
        content: newComment,
      });

      if (response.data.status) {
        setComments([response.data.comment, ...comments]);
        setNewComment("");
        if (onCommentAdded) onCommentAdded();
        if (socket?.current) {
          socket.current.emit("comment-created", { postId, comment: response.data.comment });
        }
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Error creating comment");
    }
  };

  const handleLike = async (commentId) => {
    try {
      const response = await axios.post(likeCommentRoute, {
        commentId,
        userId: currentUser._id,
      });

      if (response.data.status) {
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId ? response.data.comment : comment
          )
        );
        if (socket?.current) {
          socket.current.emit("comment-liked", {
            commentId,
            userId: currentUser._id,
            isLiked: response.data.isLiked,
          });
        }
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  return (
    <Container>
      <CommentForm onSubmit={handleSubmit}>
        <CommentInput
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <SubmitButton type="submit" disabled={!newComment.trim()}>
          Post
        </SubmitButton>
      </CommentForm>

      {loading ? (
        <Loading>Loading comments...</Loading>
      ) : (
        <CommentsList>
          {comments.map((comment) => {
            const isLiked = comment.likes?.some((like) => like._id === currentUser._id);
            return (
              <CommentItem key={comment._id}>
                <CommentAvatar>
                  {comment.author.avatarImage ? (
                    <img
                      src={
                        comment.author.avatarImage.startsWith("data:")
                          ? comment.author.avatarImage
                          : comment.author.avatarImage
                      }
                      alt={comment.author.username}
                    />
                  ) : (
                    <DefaultAvatar>{comment.author.username[0]?.toUpperCase()}</DefaultAvatar>
                  )}
                </CommentAvatar>
                <CommentContent>
                  <CommentHeader>
                    <CommentAuthor>{comment.author.username}</CommentAuthor>
                    <LikeButton
                      $active={isLiked}
                      onClick={() => handleLike(comment._id)}
                    >
                      {isLiked ? <HiHeart /> : <HiOutlineHeart />}
                      {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
                    </LikeButton>
                  </CommentHeader>
                  <CommentText>{comment.content}</CommentText>
                </CommentContent>
              </CommentItem>
            );
          })}
        </CommentsList>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #202225;
`;

const CommentForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const CommentInput = styled.input`
  flex: 1;
  background-color: #40444b;
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  color: white;
  font-size: 14px;

  &::placeholder {
    color: #72767d;
  }

  &:focus {
    outline: none;
  }
`;

const SubmitButton = styled.button`
  background-color: #5865f2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #4752c4;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Loading = styled.div`
  text-align: center;
  color: #b9bbbe;
  padding: 20px;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 12px;
`;

const CommentAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #5865f2;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
`;

const CommentContent = styled.div`
  flex: 1;
  background-color: #40444b;
  border-radius: 8px;
  padding: 10px 12px;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const CommentAuthor = styled.div`
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const LikeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: ${(props) => (props.$active ? "#ed4245" : "#b9bbbe")};
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: ${(props) => (props.$active ? "#ed4245" : "white")};
  }

  svg {
    font-size: 16px;
  }
`;

const CommentText = styled.div`
  color: #dcddde;
  font-size: 14px;
  line-height: 1.4;
`;

