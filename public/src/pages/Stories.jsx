import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getStoriesFeedRoute, createStoryRoute, viewStoryRoute } from "../utils/APIRoutes";
import { HiPlus, HiX } from "react-icons/hi";
import { toast } from "react-toastify";

export default function Stories({ currentUser, socket }) {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchStories();
  }, [currentUser]);

  const fetchStories = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await axios.get(getStoriesFeedRoute, {
        params: { userId: currentUser._id },
      });
      if (response.data.status) {
        setStories(response.data.stories);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStory = async () => {
    if (!selectedFile) {
      toast.error("Please select an image or video");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("authorId", currentUser._id);
      formData.append("media", selectedFile);

      const response = await axios.post(createStoryRoute, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status) {
        toast.success("Story created!");
        setShowCreateModal(false);
        setSelectedFile(null);
        setPreview(null);
        fetchStories();
        if (socket?.current) {
          socket.current.emit("story-created", response.data.story);
        }
      }
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error("Error creating story");
    }
  };

  const handleViewStory = async (storyId) => {
    try {
      await axios.post(viewStoryRoute, {
        storyId,
        userId: currentUser._id,
      });
      if (socket?.current) {
        socket.current.emit("story-viewed", { storyId, userId: currentUser._id });
      }
    } catch (error) {
      console.error("Error viewing story:", error);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Stories</Title>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          <HiPlus />
          Create Story
        </CreateButton>
      </Header>

      {loading ? (
        <Loading>Loading stories...</Loading>
      ) : stories.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📸</EmptyIcon>
          <EmptyText>No stories yet. Create one to get started!</EmptyText>
        </EmptyState>
      ) : (
        <StoriesGrid>
          {stories.map((storyGroup) => (
            <StoryGroup key={storyGroup.author._id}>
              <StoryGroupHeader>
                <AuthorAvatar>
                  {storyGroup.author.avatarImage ? (
                    <img
                      src={
                        storyGroup.author.avatarImage.startsWith("data:")
                          ? storyGroup.author.avatarImage
                          : storyGroup.author.avatarImage
                      }
                      alt={storyGroup.author.username}
                    />
                  ) : (
                    <DefaultAvatar>
                      {storyGroup.author.username[0]?.toUpperCase()}
                    </DefaultAvatar>
                  )}
                </AuthorAvatar>
                <AuthorName>{storyGroup.author.username}</AuthorName>
              </StoryGroupHeader>
              <StoriesList>
                {storyGroup.stories.map((story) => (
                  <StoryItem
                    key={story._id}
                    onClick={() => {
                      handleViewStory(story._id);
                      navigate(`/stories/${story._id}`);
                    }}
                  >
                    {story.media.type === "image" ? (
                      <img src={story.media.url} alt="Story" />
                    ) : (
                      <video src={story.media.url} />
                    )}
                  </StoryItem>
                ))}
              </StoriesList>
            </StoryGroup>
          ))}
        </StoriesGrid>
      )}

      {showCreateModal && (
        <ModalOverlay onClick={() => setShowCreateModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Create Story</ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>
                <HiX />
              </CloseButton>
            </ModalHeader>
            <ModalContent>
              {preview ? (
                <PreviewContainer>
                  {selectedFile.type.startsWith("image/") ? (
                    <img src={preview} alt="Preview" />
                  ) : (
                    <video src={preview} controls />
                  )}
                  <RemoveButton onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}>
                    <HiX />
                  </RemoveButton>
                </PreviewContainer>
              ) : (
                <FileInputWrapper>
                  <FileInput
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                  />
                  <FileInputLabel>
                    <HiPlus />
                    Select Image or Video
                  </FileInputLabel>
                </FileInputWrapper>
              )}
            </ModalContent>
            <ModalActions>
              <CancelButton onClick={() => setShowCreateModal(false)}>Cancel</CancelButton>
              <CreateButton onClick={handleCreateStory} disabled={!selectedFile}>
                Create
              </CreateButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #36393f;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #2f3136;
  border-bottom: 1px solid #202225;
`;

const Title = styled.h1`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
`;

const CreateButton = styled.button`
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

  &:hover:not(:disabled) {
    background-color: #4752c4;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #b9bbbe;
  font-size: 18px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #b9bbbe;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.div`
  font-size: 18px;
`;

const StoriesGrid = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 10px;
  }
`;

const StoryGroup = styled.div`
  background-color: #2f3136;
  border-radius: 12px;
  padding: 16px;
`;

const StoryGroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const AuthorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #5865f2;

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

const AuthorName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const StoriesList = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #202225;
    border-radius: 2px;
  }
`;

const StoryItem = styled.div`
  min-width: 150px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background-color: #202225;
  flex-shrink: 0;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background-color: #2f3136;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #202225;
`;

const ModalTitle = styled.h2`
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #b9bbbe;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: #202225;
    color: white;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #202225;

  img,
  video {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
`;

const FileInputWrapper = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  border: 2px dashed #40444b;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #5865f2;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #b9bbbe;
  font-size: 18px;
  font-weight: 600;

  svg {
    font-size: 48px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #202225;
`;

const CancelButton = styled.button`
  background-color: #4f545c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5d6269;
  }
`;

