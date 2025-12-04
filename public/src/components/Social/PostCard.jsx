import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  HiHeart,
  HiOutlineHeart,
  HiChat,
  HiShare,
  HiDotsHorizontal,
} from "react-icons/hi";
import { likePostRoute, sharePostRoute, getPostRoute } from "../../utils/APIRoutes";
import { toast } from "react-toastify";
import CommentSection from "./CommentSection";

export default function PostCard({ post, currentUser, socket }) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((like) => like._id === currentUser._id) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);

  const handleLike = async () => {
    try {
      const response = await axios.post(likePostRoute, {
        postId: post._id,
        userId: currentUser._id,
      });

      if (response.data.status) {
        setIsLiked(response.data.isLiked);
        setLikesCount(response.data.post.likes.length);
        if (socket?.current) {
          socket.current.emit("post-liked", {
            postId: post._id,
            userId: currentUser._id,
            isLiked: response.data.isLiked,
          });
        }
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Error liking post");
    }
  };

  const handleShare = async () => {
    try {
      const response = await axios.post(sharePostRoute, {
        postId: post._id,
        userId: currentUser._id,
      });

      if (response.data.status) {
        toast.success("Post shared!");
        if (socket?.current) {
          socket.current.emit("post-shared", {
            postId: post._id,
            userId: currentUser._id,
          });
        }
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Error sharing post");
    }
  };

  return (
    <Container>
      <Header>
        <AuthorInfo onClick={() => navigate(`/profile/${post.author._id}`)}>
          <Avatar>
            {post.author.avatarImage ? (
              <img
                src={
                  post.author.avatarImage.startsWith("data:")
                    ? post.author.avatarImage
                    : post.author.avatarImage
                }
                alt={post.author.username}
              />
            ) : (
              <DefaultAvatar>{post.author.username[0]?.toUpperCase()}</DefaultAvatar>
            )}
          </Avatar>
          <AuthorDetails>
            <AuthorName>{post.author.fullName || post.author.username}</AuthorName>
            <PostTime>{new Date(post.createdAt).toLocaleString()}</PostTime>
          </AuthorDetails>
        </AuthorInfo>
        <MoreButton>
          <HiDotsHorizontal />
        </MoreButton>
      </Header>

      {post.content && <Content>{post.content}</Content>}

      {post.media && post.media.length > 0 && (
        <MediaContainer>
          {post.media.map((media, index) => (
            <MediaItem key={index}>
              {media.type === "image" ? (
                <img src={media.url} alt={`Post media ${index}`} />
              ) : (
                <video src={media.url} controls />
              )}
            </MediaItem>
          ))}
        </MediaContainer>
      )}

      <Stats>
        <StatItem>
          <HiHeart /> {likesCount}
        </StatItem>
        <StatItem onClick={() => setShowComments(!showComments)}>
          <HiChat /> {commentsCount}
        </StatItem>
        <StatItem>
          <HiShare /> {post.shareCount || 0}
        </StatItem>
      </Stats>

      <Actions>
        <ActionButton $active={isLiked} onClick={handleLike}>
          {isLiked ? <HiHeart /> : <HiOutlineHeart />}
          <span>Like</span>
        </ActionButton>
        <ActionButton onClick={() => setShowComments(!showComments)}>
          <HiChat />
          <span>Comment</span>
        </ActionButton>
        <ActionButton onClick={handleShare}>
          <HiShare />
          <span>Share</span>
        </ActionButton>
      </Actions>

      {showComments && (
        <CommentSection
          postId={post._id}
          currentUser={currentUser}
          socket={socket}
          onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  background-color: #2f3136;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
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
  font-size: 18px;
`;

const AuthorDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const AuthorName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 15px;
`;

const PostTime = styled.div`
  color: #72767d;
  font-size: 13px;
`;

const MoreButton = styled.button`
  background: none;
  border: none;
  color: #b9bbbe;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: #202225;
    color: white;
  }
`;

const Content = styled.div`
  color: #dcddde;
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const MediaContainer = styled.div`
  display: grid;
  grid-template-columns: ${(props) =>
    props.children?.length === 1 ? "1fr" : "repeat(2, 1fr)"};
  gap: 8px;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MediaItem = styled.div`
  width: 100%;
  background-color: #202225;
  border-radius: 8px;
  overflow: hidden;

  img,
  video {
    width: 100%;
    height: auto;
    display: block;
    max-height: 500px;
    object-fit: contain;
  }
`;

const Stats = styled.div`
  display: flex;
  gap: 20px;
  padding: 8px 0;
  border-top: 1px solid #202225;
  border-bottom: 1px solid #202225;
  margin-bottom: 8px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #b9bbbe;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    color: white;
  }

  svg {
    font-size: 18px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 8px;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: transparent;
  border: none;
  color: ${(props) => (props.$active ? "#ed4245" : "#b9bbbe")};
  font-size: 14px;
  font-weight: 600;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #202225;
    color: ${(props) => (props.$active ? "#ed4245" : "white")};
  }

  svg {
    font-size: 20px;
  }
`;

