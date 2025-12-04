import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getGroupsRoute, getUserGroupsRoute, createGroupRoute, joinGroupRoute } from "../utils/APIRoutes";
import { HiPlus, HiUserGroup } from "react-icons/hi";
import { toast } from "react-toastify";

export default function Groups({ currentUser, socket }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, [currentUser]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(getGroupsRoute, {
        params: { userId: currentUser._id },
      });
      if (response.data.status) {
        setGroups(response.data.groups);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const response = await axios.get(`${getUserGroupsRoute}/${currentUser._id}`);
      if (response.data.status) {
        setMyGroups(response.data.groups);
      }
    } catch (error) {
      console.error("Error fetching my groups:", error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      const response = await axios.post(createGroupRoute, {
        creatorId: currentUser._id,
        name: groupName,
        description: groupDescription,
        isPublic: true,
      });

      if (response.data.status) {
        toast.success("Group created!");
        setShowCreateModal(false);
        setGroupName("");
        setGroupDescription("");
        fetchGroups();
        fetchMyGroups();
        if (socket?.current) {
          socket.current.emit("group-created", response.data.group);
        }
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Error creating group");
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await axios.post(joinGroupRoute, {
        groupId,
        userId: currentUser._id,
      });

      if (response.data.status) {
        toast.success("Joined group!");
        fetchGroups();
        fetchMyGroups();
        if (socket?.current) {
          socket.current.emit("group-member-added", {
            groupId,
            member: response.data.group.members[response.data.group.members.length - 1],
          });
        }
      } else {
        toast.error(response.data.msg);
      }
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Error joining group");
    }
  };

  const isMember = (group) => {
    return group.members?.some((m) => m.userId._id === currentUser._id);
  };

  return (
    <Container>
      <Header>
        <Title>Groups</Title>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          <HiPlus />
          Create Group
        </CreateButton>
      </Header>

      <Tabs>
        <Tab $active={activeTab === "all"} onClick={() => setActiveTab("all")}>
          All Groups
        </Tab>
        <Tab $active={activeTab === "my"} onClick={() => setActiveTab("my")}>
          My Groups ({myGroups.length})
        </Tab>
      </Tabs>

      {loading ? (
        <Loading>Loading groups...</Loading>
      ) : (
        <GroupsGrid>
          {(activeTab === "all" ? groups : myGroups).map((group) => (
            <GroupCard key={group._id}>
              <GroupCover>
                {group.coverImage ? (
                  <img src={group.coverImage} alt="Cover" />
                ) : (
                  <DefaultCover />
                )}
              </GroupCover>
              <GroupContent>
                <GroupAvatar>
                  {group.avatar ? (
                    <img src={group.avatar} alt="Avatar" />
                  ) : (
                    <DefaultAvatar>
                      <HiUserGroup />
                    </DefaultAvatar>
                  )}
                </GroupAvatar>
                <GroupInfo>
                  <GroupName>{group.name}</GroupName>
                  <GroupDescription>{group.description || "No description"}</GroupDescription>
                  <GroupStats>
                    <Stat>{group.members?.length || 0} members</Stat>
                    {group.isPublic ? <Stat>Public</Stat> : <Stat>Private</Stat>}
                  </GroupStats>
                </GroupInfo>
                {activeTab === "all" && !isMember(group) && (
                  <JoinButton onClick={() => handleJoinGroup(group._id)}>
                    Join Group
                  </JoinButton>
                )}
                {isMember(group) && (
                  <ViewButton onClick={() => navigate(`/groups/${group._id}`)}>
                    View Group
                  </ViewButton>
                )}
              </GroupContent>
            </GroupCard>
          ))}
        </GroupsGrid>
      )}

      {showCreateModal && (
        <ModalOverlay onClick={() => setShowCreateModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Create Group</ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalContent>
              <Form onSubmit={handleCreateGroup}>
                <Input
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
                <TextArea
                  placeholder="Description (optional)"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows="4"
                />
                <ModalActions>
                  <CancelButton type="button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </CancelButton>
                  <CreateButton type="submit">Create</CreateButton>
                </ModalActions>
              </Form>
            </ModalContent>
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

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background-color: #2f3136;
  border-bottom: 1px solid #202225;
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

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #b9bbbe;
  font-size: 18px;
`;

const GroupsGrid = styled.div`
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

const GroupCard = styled.div`
  background-color: #2f3136;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
`;

const GroupCover = styled.div`
  width: 100%;
  height: 120px;
  background-color: #5865f2;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultCover = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const GroupContent = styled.div`
  padding: 16px;
  position: relative;
`;

const GroupAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 4px solid #2f3136;
  margin-top: -40px;
  background-color: #5865f2;
  overflow: hidden;

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
  font-size: 28px;
`;

const GroupInfo = styled.div`
  margin-top: 8px;
`;

const GroupName = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

const GroupDescription = styled.p`
  color: #b9bbbe;
  font-size: 14px;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const GroupStats = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

const Stat = styled.span`
  color: #72767d;
  font-size: 12px;
`;

const JoinButton = styled.button`
  width: 100%;
  background-color: #5865f2;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4752c4;
  }
`;

const ViewButton = styled.button`
  width: 100%;
  background-color: #43b581;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3ca374;
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
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background-color: #202225;
    color: white;
  }
`;

const ModalContent = styled.div`
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  background-color: #202225;
  border: none;
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-size: 16px;

  &::placeholder {
    color: #72767d;
  }

  &:focus {
    outline: none;
  }
`;

const TextArea = styled.textarea`
  background-color: #202225;
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

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
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

