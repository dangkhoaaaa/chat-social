import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { getProfileRoute, getUserPostsRoute, followRoute } from "../utils/APIRoutes";
import PostCard from "../components/Social/PostCard";
import { HiPencil, HiUserAdd, HiBadgeCheck } from "react-icons/hi";
import { toast } from "react-toastify";

export default function Profile({ currentUser, socket }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = userId === currentUser?._id;

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${getProfileRoute}/${userId}`);
      if (response.data.status) {
        setUser(response.data.user);
        setIsFollowing(
          response.data.user.followers?.some((f) => f._id === currentUser._id) || false
        );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${getUserPostsRoute}/${userId}`);
      if (response.data.status) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await axios.post(followRoute, {
        userId: currentUser._id,
        targetUserId: userId,
      });

      if (response.data.status) {
        setIsFollowing(response.data.isFollowing);
        fetchProfile();
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Error following user");
    }
  };

  if (loading) {
    return <Loading>Loading profile...</Loading>;
  }

  if (!user) {
    return <Error>User not found</Error>;
  }

  return (
    <Container>
      <CoverImage>
        {user.coverImage ? (
          <img src={user.coverImage} alt="Cover" />
        ) : (
          <DefaultCover />
        )}
      </CoverImage>

      <ProfileSection>
        <AvatarSection>
          <Avatar>
            {user.avatarImage ? (
              <img
                src={
                  user.avatarImage.startsWith("data:")
                    ? user.avatarImage
                    : user.avatarImage
                }
                alt={user.username}
              />
            ) : (
              <DefaultAvatar>{user.username[0]?.toUpperCase()}</DefaultAvatar>
            )}
          </Avatar>
          {isOwnProfile && (
            <EditButton onClick={() => navigate("/profile/edit")}>
              <HiPencil />
              Edit Profile
            </EditButton>
          )}
          {!isOwnProfile && (
            <FollowButton $following={isFollowing} onClick={handleFollow}>
              {isFollowing ? <HiBadgeCheck /> : <HiUserAdd />}
              {isFollowing ? "Following" : "Follow"}
            </FollowButton>
          )}
        </AvatarSection>

        <UserInfo>
          <Username>{user.fullName || user.username}</Username>
          <UserBio>{user.bio || "No bio yet"}</UserBio>
          <UserStats>
            <Stat>
              <StatNumber>{posts.length}</StatNumber>
              <StatLabel>Posts</StatLabel>
            </Stat>
            <Stat>
              <StatNumber>{user.followers?.length || 0}</StatNumber>
              <StatLabel>Followers</StatLabel>
            </Stat>
            <Stat>
              <StatNumber>{user.following?.length || 0}</StatNumber>
              <StatLabel>Following</StatLabel>
            </Stat>
          </UserStats>
        </UserInfo>
      </ProfileSection>

      <PostsSection>
        <SectionTitle>Posts</SectionTitle>
        {posts.length === 0 ? (
          <EmptyState>No posts yet</EmptyState>
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
      </PostsSection>
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: #36393f;
`;

const CoverImage = styled.div`
  width: 100%;
  height: 300px;
  background-color: #5865f2;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    height: 200px;
  }
`;

const DefaultCover = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const ProfileSection = styled.div`
  padding: 20px;
  background-color: #2f3136;
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-top: -60px;
  margin-bottom: 16px;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #2f3136;
  overflow: hidden;
  background-color: #5865f2;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
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
  font-size: 48px;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #5865f2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4752c4;
  }
`;

const FollowButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${(props) => (props.$following ? "#4f545c" : "#5865f2")};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => (props.$following ? "#5d6269" : "#4752c4")};
  }
`;

const UserInfo = styled.div`
  margin-top: 16px;
`;

const Username = styled.h1`
  color: white;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const UserBio = styled.p`
  color: #b9bbbe;
  font-size: 16px;
  margin: 0 0 16px 0;
`;

const UserStats = styled.div`
  display: flex;
  gap: 32px;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatNumber = styled.div`
  color: white;
  font-size: 20px;
  font-weight: 700;
`;

const StatLabel = styled.div`
  color: #b9bbbe;
  font-size: 14px;
`;

const PostsSection = styled.div`
  padding: 20px;
  max-width: 680px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #b9bbbe;
  padding: 40px;
  font-size: 16px;
`;

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #b9bbbe;
  font-size: 18px;
`;

const Error = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ed4245;
  font-size: 18px;
`;

