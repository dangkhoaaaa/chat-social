import React, { useState, useRef } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import { HiPhotograph } from "react-icons/hi";
import { HiX } from "react-icons/hi";
import styled from "styled-components";
import Picker from "emoji-picker-react";

export default function ChatInput({ handleSendMsg, handleTyping, handleSendMedia }) {
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleEmojiPickerhideShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (event, emojiObject) => {
    let message = msg;
    message += emojiObject.emoji;
    setMsg(message);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendChat = (event) => {
    event.preventDefault();
    if (mediaFile && handleSendMedia) {
      handleSendMedia(mediaFile);
      removeMedia();
    } else if (msg.length > 0) {
      handleSendMsg(msg);
      setMsg("");
      handleTyping(false);
    }
  };

  return (
    <Container>
      {mediaPreview && (
        <MediaPreview>
          <RemoveMediaButton onClick={removeMedia}>
            <HiX />
          </RemoveMediaButton>
          {mediaFile.type.startsWith("image/") ? (
            <img src={mediaPreview} alt="Preview" />
          ) : (
            <video src={mediaPreview} controls />
          )}
        </MediaPreview>
      )}
      <div className="button-container">
        <div className="emoji">
          <BsEmojiSmileFill onClick={handleEmojiPickerhideShow} />
          {showEmojiPicker && <Picker onEmojiClick={handleEmojiClick} />}
        </div>
        <MediaButton onClick={() => fileInputRef.current?.click()}>
          <HiPhotograph />
        </MediaButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
      <form className="input-container" onSubmit={(event) => sendChat(event)}>
        <input
          type="text"
          placeholder="type your message here"
          onChange={(e) => {
            setMsg(e.target.value);
            handleTyping(e.target.value.length > 0);
          }}
          onBlur={() => handleTyping(false)}
          value={msg}
        />
        <button type="submit" disabled={!msg.trim() && !mediaFile}>
          <IoMdSend />
        </button>
      </form>
    </Container>
  );
}



const MediaPreview = styled.div`
  position: relative;
  max-width: 300px;
  max-height: 200px;
  margin-bottom: 8px;
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

const RemoveMediaButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
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

const MediaButton = styled.button``;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  grid-template-columns: 5% 95%;
  background-color: #2f3136;
  padding: 1rem;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    padding: 0.5rem;
    gap: 1rem;
  }
  .button-container {
    display: flex;
    align-items: center;
    color: white;
    gap: 1rem;
    .emoji {
      position: relative;
      svg {
        font-size: 1.5rem;
        color: #ffff00c8;
        cursor: pointer;
      }
      .emoji-picker-react {
        position: absolute;
        bottom: 50px;
        left: 0;
        background-color: #2f3136;
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
        border-color: #5865f2;
        .emoji-scroll-wrapper::-webkit-scrollbar {
          background-color: #2f3136;
          width: 5px;
          &-thumb {
            background-color: #5865f2;
          }
        }
        .emoji-categories {
          button {
            filter: contrast(0);
          }
        }
        .emoji-search {
          background-color: transparent;
          border-color: #5865f2;
        }
        .emoji-group:before {
          background-color: #2f3136;
        }
      }
    }
  }
  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    background-color: #ffffff34;
    input {
      width: 90%;
      height: 60%;
      background-color: transparent;
      color: white;
      border: none;
      padding-left: 1rem;
      font-size: 1.2rem;

      &::selection {
        background-color: #9a86f3;
      }
      &:focus {
        outline: none;
      }
    }
    button {
      padding: 0.3rem 2rem;
      border-radius: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #9a86f3;
      border: none;
      @media screen and (min-width: 720px) and (max-width: 1080px) {
        padding: 0.3rem 1rem;
        svg {
          font-size: 1rem;
        }
      }
      svg {
        font-size: 2rem;
        color: white;
      }
    }
  }
`;
