import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { HiArrowLeft } from "react-icons/hi";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket, currentUser, onlineUsers, handleBack }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [isOnline, setIsOnline] = useState(false);
  useEffect(async () => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    const response = await axios.post(recieveMessageRoute, {
      from: data._id,
      to: currentChat._id,
    });
    setMessages(response.data);
  }, [currentChat]);

  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )._id;
      }
    };
    getCurrentChat();
  }, [currentChat]);

  const handleTyping = (isTyping) => {
    if (socket.current && currentChat) {
      socket.current.emit("typing", {
        userId: currentUser._id,
        receiverId: currentChat._id,
        isTyping
      });
    }
  };

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    const sentMsg = {
      message: msg,
      messageType: "text",
    };
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: data._id,
      msg: sentMsg,
    });
    await axios.post(sendMessageRoute, {
      from: data._id,
      to: currentChat._id,
      message: msg,
      messageType: "text",
    });

    const msgs = [...messages];
    msgs.push({ fromSelf: true, ...sentMsg });
    setMessages(msgs);

    handleTyping(false);
  };

  const handleSendMedia = async (file) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );

    try {
      const formData = new FormData();
      formData.append("from", data._id);
      formData.append("to", currentChat._id);
      formData.append("media", file);
      formData.append("messageType", file.type.startsWith("image/") ? "image" : "video");

      const response = await axios.post(sendMessageRoute, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status) {
        const sentMsg = {
          message: "",
          messageType: file.type.startsWith("image/") ? "image" : "video",
          media: response.data.message.media,
        };
        const msgs = [...messages];
        msgs.push({ fromSelf: true, ...sentMsg });
        setMessages(msgs);

        socket.current.emit("send-msg", {
          to: currentChat._id,
          from: data._id,
          msg: sentMsg,
        });
      }
    } catch (error) {
      console.error("Error sending media:", error);
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (msg) => {
        setArrivalMessage({ fromSelf: false, ...msg });
      });
      socket.current.on("user-typing", ({ userId, isTyping }) => {
        setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));
      });
      socket.current.on("user-status-change", ({ userId, isOnline }) => {
        console.log("dd");
        if (userId === currentChat._id) {
          console.log("d");
          setIsOnline(isOnline);
        }
      });
    }
    return () => {
      if (socket.current) {
        socket.current.off("msg-recieve");
        socket.current.off("user-typing");
        socket.current.off("user-status-change");
      }
    };
  }, [socket]);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <BackButton onClick={handleBack}>
            <HiArrowLeft />
          </BackButton>
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => {
          return (
            <div ref={index === messages.length - 1 ? scrollRef : null} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                {message.sender && !message.fromSelf && (
                  <div className="sender-avatar">
                    <img
                      src={
                        message.sender.avatarImage
                          ? message.sender.avatarImage.startsWith("data:")
                            ? message.sender.avatarImage
                            : message.sender.avatarImage
                          : ""
                      }
                      alt={message.sender.username}
                    />
                  </div>
                )}
                <div className="content">
                  {message.messageType === "image" && message.media ? (
                    <img src={message.media.url} alt="Shared image" />
                  ) : message.messageType === "video" && message.media ? (
                    <video src={message.media.url} controls />
                  ) : (
                    <p>{message.message}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="chat-typing">
        {typingUsers[currentChat._id] && (
          <div className="typing-indicator">{currentChat.username} is typing...</div>
        )}
      </div>
      <ChatInput
        handleSendMsg={handleSendMsg}
        handleTyping={handleTyping}
        handleSendMedia={handleSendMedia}
      />
    </Container>
  );
}

const BackButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  
  &:hover {
    background-color: #ffffff1a;
  }

  @media screen and (max-width: 720px) {
    display: block;
  }
`;

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 70% 10% 10%;
  gap: 0.1rem;
  overflow: hidden;

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
        .online-status {
          font-size: 0.8rem;
          margin-top: 0.2rem;
        }
        .online {
          color: #44b700;
        }
        .offline {
          color: #ccc;
        }
      }
    }
  }

  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      .sender-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
        img,
        video {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          object-fit: contain;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }

  .chat-typing {
    padding: 0 2rem;
    display: flex;
    align-items: center;
    .typing-indicator {
      color: #ffffff;
      font-size: 0.9rem;
      opacity: 0.5;
    }
  }
.typing-indicator {
  color: #ffffff;
  font-size: 0.9rem;
  opacity: 0.5;
  animation: fadeInOut 1.5s ease-in-out infinite;
}

@keyframes fadeInOut {
  0% { opacity: 0.3; }
  50% { opacity: 0.7; }
  100% { opacity: 0.3; }
}
  .chat-input {
    // ... existing styles for ChatInput container if any ...
  }
`;
