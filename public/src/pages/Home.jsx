import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { getPostsFeedRoute, createPostRoute } from "../utils/APIRoutes";
import PostCard from "../components/Social/PostCard";
import CreatePost from "../components/Social/CreatePost";
import StoryBar from "../components/Social/StoryBar";

export default function Home({ currentUser, socket }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [currentUser]);

  useEffect(() => {
    if (socket?.current) {
      socket.current.on("new-post", (newPost) => {
        setPosts((prev) => [newPost, ...prev]);
      });

      socket.current.on("post-like-update", ({ postId, userId, isLiked }) => {
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id === postId) {
              if (isLiked) {
                return {
                  ...post,
                  likes: [...post.likes, userId],
                };
              } else {
                return {
                  ...post,
                  likes: post.likes.filter((id) => id.toString() !== userId),
                };
              }
            }
            return post;
          })
        );
      });

      return () => {
        socket.current.off("new-post");
        socket.current.off("post-like-update");
      };
    }
  }, [socket]);

  const fetchPosts = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await axios.get(getPostsFeedRoute, {
        params: { userId: currentUser._id, page: 1, limit: 10 },
      });
      if (response.data.status) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    if (socket?.current) {
      socket.current.emit("post-created", newPost);
    }
  };

  return (
    <Container>
      <Content>
        <StoryBar currentUser={currentUser} />
        <CreatePost currentUser={currentUser} onPostCreated={handlePostCreated} />
        {loading ? (
          <Loading>Loading posts...</Loading>
        ) : posts.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📭</EmptyIcon>
            <EmptyText>No posts yet. Be the first to post!</EmptyText>
          </EmptyState>
        ) : (
          <PostsList>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser}
                socket={socket}
              />
            ))}
          </PostsList>
        )}
      </Content>
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  background-color: #36393f;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Content = styled.div`
  width: 100%;
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Loading = styled.div`
  text-align: center;
  color: #b9bbbe;
  padding: 40px;
  font-size: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #b9bbbe;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.div`
  font-size: 18px;
`;

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

