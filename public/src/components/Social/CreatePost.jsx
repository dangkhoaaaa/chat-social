import React, { useState, useRef } from "react";
import styled from "styled-components";
import axios from "axios";
import { createPostRoute } from "../../utils/APIRoutes";
import { HiPhotograph, HiX } from "react-icons/hi";
import { toast } from "react-toastify";

export default function CreatePost({ currentUser, onPostCreated }) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (imageFiles.length > 10) {
      toast.error("Maximum 10 files allowed");
      return;
    }

    setMediaFiles([...mediaFiles, ...imageFiles]);

    // Create previews
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews((prev) => [
          ...prev,
          { file, preview: reader.result, type: file.type.startsWith("image/") ? "image" : "video" },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error("Please write something or add media");
      return;
    }

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("authorId", currentUser._id);
      formData.append("content", content);
      formData.append("isPublic", true);

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await axios.post(createPostRoute, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status) {
        toast.success("Post created successfully!");
        setContent("");
        setMediaFiles([]);
        setMediaPreviews([]);
        onPostCreated(response.data.post);
      } else {
        toast.error("Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Error creating post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Container>
      <Header>
        <Avatar>
          {currentUser?.avatarImage ? (
            <img
              src={
                currentUser.avatarImage.startsWith("data:")
                  ? currentUser.avatarImage
                  : currentUser.avatarImage
              }
              alt={currentUser.username}
            />
          ) : (
            <DefaultAvatar>{currentUser?.username[0]?.toUpperCase()}</DefaultAvatar>
          )}
        </Avatar>
        <Form onSubmit={handleSubmit}>
          <TextArea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="3"
          />
          {mediaPreviews.length > 0 && (
            <MediaPreview>
              {mediaPreviews.map((item, index) => (
                <MediaItem key={index}>
                  <RemoveButton onClick={() => removeMedia(index)}>
                    <HiX />
                  </RemoveButton>
                  {item.type === "image" ? (
                    <img src={item.preview} alt={`Preview ${index}`} />
                  ) : (
                    <video src={item.preview} controls />
                  )}
                </MediaItem>
              ))}
            </MediaPreview>
          )}
          <Actions>
            <FileInput
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
            />
            <MediaButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <HiPhotograph />
              <span>Photo/Video</span>
            </MediaButton>
            <SubmitButton type="submit" disabled={isPosting}>
              {isPosting ? "Posting..." : "Post"}
            </SubmitButton>
          </Actions>
        </Form>
      </Header>
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
  gap: 12px;
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

const Form = styled.form`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TextArea = styled.textarea`
  width: 100%;
  background-color: #40444b;
  border: none;
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-size: 16px;
  resize: none;
  font-family: inherit;

  &::placeholder {
    color: #72767d;
  }

  &:focus {
    outline: none;
  }
`;

const MediaPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 8px;
`;

const MediaItem = styled.div`
  position: relative;
  width: 100%;
  padding-top: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #202225;

  img,
  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 1;

  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const MediaButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: transparent;
  border: none;
  color: #b9bbbe;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #202225;
    color: white;
  }

  svg {
    font-size: 20px;
  }
`;

const SubmitButton = styled.button`
  background-color: #5865f2;
  color: white;
  border: none;
  padding: 8px 20px;
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

