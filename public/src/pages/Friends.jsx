import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import {
  getFriendsRoute,
  getFriendRequestsRoute,
  acceptFriendRequestRoute,
  rejectFriendRequestRoute,
  sendFriendRequestRoute,
  searchUsersRoute,
} from "../utils/APIRoutes";
import { HiUserAdd, HiCheck, HiX, HiSearch } from "react-icons/hi";
import { toast } from "react-toastify";

export default function Friends({ currentUser, socket }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");

  useEffect(() => {
    if (activeTab === "friends") {
      fetchFriends();
    } else if (activeTab === "requests") {
      fetchRequests();
    }
  }, [activeTab, currentUser]);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${getFriendsRoute}/${currentUser._id}`);
      if (response.data.status) {
        setFriends(response.data.friends);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${getFriendRequestsRoute}/${currentUser._id}`);
      if (response.data.status) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(searchUsersRoute, {
        params: { query, userId: currentUser._id },
      });
      if (response.data.status) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleSendRequest = async (recipientId) => {
    try {
      const response = await axios.post(sendFriendRequestRoute, {
        requesterId: currentUser._id,
        recipientId,
      });

      if (response.data.status) {
        toast.success("Friend request sent!");
        handleSearch(searchQuery);
        if (socket?.current) {
          socket.current.emit("friend-request-sent", {
            recipientId,
            request: response.data.friendship,
          });
        }
      } else {
        toast.error(response.data.msg);
      }
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error("Error sending friend request");
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      const response = await axios.post(acceptFriendRequestRoute, {
        friendshipId,
        userId: currentUser._id,
      });

      if (response.data.status) {
        toast.success("Friend request accepted!");
        fetchRequests();
        fetchFriends();
        if (socket?.current) {
          socket.current.emit("friend-request-accepted", {
            requesterId: response.data.friendship.requester,
            friendship: response.data.friendship,
          });
        }
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Error accepting friend request");
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      const response = await axios.post(rejectFriendRequestRoute, {
        friendshipId,
        userId: currentUser._id,
      });

      if (response.data.status) {
        toast.success("Friend request rejected");
        fetchRequests();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Error rejecting friend request");
    }
  };

  return (
    <Container>
      <Header>
        <Title>Friends</Title>
        <Tabs>
          <Tab $active={activeTab === "friends"} onClick={() => setActiveTab("friends")}>
            Friends
          </Tab>
          <Tab $active={activeTab === "requests"} onClick={() => setActiveTab("requests")}>
            Requests ({requests.length})
          </Tab>
          <Tab $active={activeTab === "search"} onClick={() => setActiveTab("search")}>
            Find Friends
          </Tab>
        </Tabs>
      </Header>

      {activeTab === "search" && (
        <SearchSection>
          <SearchInput
            placeholder="Search for friends..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
          />
          <SearchIcon>
            <HiSearch />
          </SearchIcon>
        </SearchSection>
      )}

      <Content>
        {activeTab === "friends" && (
          <FriendsList>
            {friends.length === 0 ? (
              <EmptyState>No friends yet</EmptyState>
            ) : (
              friends.map((friend) => (
                <FriendItem key={friend._id}>
                  <FriendAvatar>
                    {friend.avatarImage ? (
                      <img
                        src={
                          friend.avatarImage.startsWith("data:")
                            ? friend.avatarImage
                            : friend.avatarImage
                        }
                        alt={friend.username}
                      />
                    ) : (
                      <DefaultAvatar>{friend.username[0]?.toUpperCase()}</DefaultAvatar>
                    )}
                  </FriendAvatar>
                  <FriendInfo>
                    <FriendName>{friend.fullName || friend.username}</FriendName>
                    <FriendStatus $online={friend.isOnline}>
                      {friend.isOnline ? "Online" : "Offline"}
                    </FriendStatus>
                  </FriendInfo>
                </FriendItem>
              ))
            )}
          </FriendsList>
        )}

        {activeTab === "requests" && (
          <RequestsList>
            {requests.length === 0 ? (
              <EmptyState>No pending requests</EmptyState>
            ) : (
              requests.map((request) => (
                <RequestItem key={request._id}>
                  <RequestAvatar>
                    {request.requester.avatarImage ? (
                      <img
                        src={
                          request.requester.avatarImage.startsWith("data:")
                            ? request.requester.avatarImage
                            : request.requester.avatarImage
                        }
                        alt={request.requester.username}
                      />
                    ) : (
                      <DefaultAvatar>
                        {request.requester.username[0]?.toUpperCase()}
                      </DefaultAvatar>
                    )}
                  </RequestAvatar>
                  <RequestInfo>
                    <RequestName>
                      {request.requester.fullName || request.requester.username}
                    </RequestName>
                    <RequestActions>
                      <AcceptButton onClick={() => handleAcceptRequest(request._id)}>
                        <HiCheck />
                        Accept
                      </AcceptButton>
                      <RejectButton onClick={() => handleRejectRequest(request._id)}>
                        <HiX />
                        Reject
                      </RejectButton>
                    </RequestActions>
                  </RequestInfo>
                </RequestItem>
              ))
            )}
          </RequestsList>
        )}

        {activeTab === "search" && (
          <SearchResults>
            {searchResults.length === 0 && searchQuery.length >= 2 ? (
              <EmptyState>No users found</EmptyState>
            ) : searchResults.length === 0 ? (
              <EmptyState>Start typing to search for friends</EmptyState>
            ) : (
              searchResults.map((user) => {
                const canSendRequest =
                  !user.friendshipStatus || user.friendshipStatus === "rejected";
                return (
                  <SearchItem key={user._id}>
                    <SearchAvatar>
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
                    </SearchAvatar>
                    <SearchInfo>
                      <SearchName>{user.fullName || user.username}</SearchName>
                      {canSendRequest && (
                        <AddButton onClick={() => handleSendRequest(user._id)}>
                          <HiUserAdd />
                          Add Friend
                        </AddButton>
                      )}
                      {user.friendshipStatus === "pending" && (
                        <StatusText>Request sent</StatusText>
                      )}
                      {user.friendshipStatus === "accepted" && (
                        <StatusText>Already friends</StatusText>
                      )}
                    </SearchInfo>
                  </SearchItem>
                );
              })
            )}
          </SearchResults>
        )}
      </Content>
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
  padding: 20px;
  background-color: #2f3136;
  border-bottom: 1px solid #202225;
`;

const Title = styled.h1`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 16px 0;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
`;

const Tab = styled.button`
  background-color: ${(props) => (props.$active ? "#5865f2" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#b9bbbe")};
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.$active ? "#5865f2" : "#202225")};
    color: white;
  }
`;

const SearchSection = styled.div`
  padding: 16px 20px;
  background-color: #2f3136;
  border-bottom: 1px solid #202225;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: #202225;
  border: none;
  border-radius: 8px;
  padding: 12px 40px 12px 16px;
  color: white;
  font-size: 16px;

  &::placeholder {
    color: #72767d;
  }

  &:focus {
    outline: none;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  color: #72767d;
  font-size: 20px;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const FriendsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #2f3136;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #202225;
  }
`;

const FriendAvatar = styled.div`
  width: 50px;
  height: 50px;
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
  font-size: 20px;
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FriendStatus = styled.div`
  color: ${(props) => (props.$online ? "#43b581" : "#72767d")};
  font-size: 13px;
`;

const RequestsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RequestItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #2f3136;
  border-radius: 8px;
`;

const RequestAvatar = styled(FriendAvatar)``;

const RequestInfo = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const RequestName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const RequestActions = styled.div`
  display: flex;
  gap: 8px;
`;

const AcceptButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #43b581;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3ca374;
  }
`;

const RejectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #ed4245;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c03537;
  }
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SearchItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #2f3136;
  border-radius: 8px;
`;

const SearchAvatar = styled(FriendAvatar)``;

const SearchInfo = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const SearchName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #5865f2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4752c4;
  }
`;

const StatusText = styled.div`
  color: #b9bbbe;
  font-size: 14px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #b9bbbe;
  padding: 60px 20px;
  font-size: 16px;
`;

