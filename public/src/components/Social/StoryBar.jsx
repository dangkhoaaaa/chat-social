import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUserStoriesRoute } from "../../utils/APIRoutes";
import { HiPlus } from "react-icons/hi";

export default function StoryBar({ currentUser }) {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, [currentUser]);

  const fetchStories = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      // Fetch stories from friends
      // For now, just show current user's stories
      const response = await axios.get(`${getUserStoriesRoute}/${currentUser._id}`);
      if (response.data.status) {
        setStories(response.data.stories);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <CreateStoryButton onClick={() => navigate("/stories/create")}>
        <PlusIcon>
          <HiPlus />
        </PlusIcon>
        <CreateText>Create Story</CreateText>
      </CreateStoryButton>

      {!loading && stories.length > 0 && (
        <StoriesList>
          {stories.slice(0, 5).map((story) => (
            <StoryItem
              key={story._id}
              onClick={() => navigate(`/stories/${story._id}`)}
            >
              <StoryImage>
                {story.media.type === "image" ? (
                  <img src={story.media.url} alt="Story" />
                ) : (
                  <video src={story.media.url} />
                )}
              </StoryImage>
              <StoryOverlay>
                <StoryAuthor>{currentUser.username}</StoryAuthor>
              </StoryOverlay>
            </StoryItem>
          ))}
        </StoriesList>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  padding: 12px 0;
  min-height: 204px;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #202225;
    border-radius: 2px;
  }
`;

const CreateStoryButton = styled.button`
  min-width: 100px;
  height: 180px;
  background-color: #2f3136;
  border: 2px dashed #40444b;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: #40444b;
    border-color: #5865f2;
  }
`;

const PlusIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #5865f2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`;

const CreateText = styled.div`
  color: #b9bbbe;
  font-size: 13px;
  font-weight: 600;
`;

const StoriesList = styled.div`
  display: flex;
  gap: 12px;
`;

const StoryItem = styled.div`
  min-width: 100px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const StoryImage = styled.div`
  width: 100%;
  height: 100%;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const StoryOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 12px 8px 8px;
`;

const StoryAuthor = styled.div`
  color: white;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

