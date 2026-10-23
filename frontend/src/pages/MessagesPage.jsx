import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Search,
  AlertCircle,
  ArrowLeft,
  Plus,
  X,
  MapPin,
  Check,
  CheckCheck,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeftSidebar from '../components/LeftSidebar.jsx';
import BackButton from '../components/BackButton.jsx';
import './MessagesPage.css';

const QUICK_STARTERS = [
  'Hi! I saw your post on JanFeed and wanted to coordinate.',
  'Are you currently in the district to verify this on-ground?',
  'Can we collaborate on submitting a follow-up report to the administration?',
  'Do you have the contact of the local block officer?',
];

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [convFilter, setConvFilter] = useState('');

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const initialRecipientId = searchParams.get('recipient');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/messages');
    }
  }, [isAuthenticated, navigate]);

  // Fetch all conversations
  const fetchConversations = async (targetActiveId = null) => {
    try {
      const res = await apiRequest('/conversations');
      if (res.success && res.data?.conversations) {
        setConversations(res.data.conversations);

        if (targetActiveId) {
          const match = res.data.conversations.find((c) => c._id === targetActiveId);
          if (match) setActiveConv(match);
        } else if (!activeConv && res.data.conversations.length > 0 && !initialRecipientId) {
          setActiveConv(res.data.conversations[0]);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [isAuthenticated]);

  // Handle URL recipient parameter (e.g. from ChallengeCard or UserProfile)
  useEffect(() => {
    if (initialRecipientId && isAuthenticated) {
      const startConv = async () => {
        try {
          const res = await apiRequest('/conversations', {
            method: 'POST',
            body: JSON.stringify({ recipientId: initialRecipientId }),
          });
          if (res.success && res.data?.conversation) {
            setActiveConv(res.data.conversation);
            fetchConversations(res.data.conversation._id);
            // Clear parameter from URL cleanly
            searchParams.delete('recipient');
            setSearchParams(searchParams, { replace: true });
          }
        } catch (err) {
          console.error('Error starting conversation:', err.message);
        }
      };
      startConv();
    }
  }, [initialRecipientId, isAuthenticated]);

  // Fetch messages for active conversation
  const fetchMessages = async (convId, silent = false) => {
    try {
      const res = await apiRequest(`/conversations/${convId}/messages`);
      if (res.success && res.data?.messages) {
        setMessages(res.data.messages);
        // Mark conversation read
        apiRequest(`/conversations/${convId}/read`, { method: 'PATCH' }).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv._id);

      // Fast polling (every 3.5s) for live chatting
      const interval = setInterval(() => {
        fetchMessages(activeConv._id, true);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [activeConv?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || newMsgText).trim();
    if (!text || !activeConv || sending) return;

    setSending(true);
    try {
      const res = await apiRequest(
        `/conversations/${activeConv._id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ body: text }),
        }
      );

      if (res.success && res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setNewMsgText('');
        fetchConversations(activeConv._id);
      }
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Directory search for New Message modal
  const fetchDirectoryUsers = async (searchQuery = '') => {
    setSearchingUsers(true);
    try {
      const url = searchQuery.trim()
        ? `/users?search=${encodeURIComponent(searchQuery.trim())}`
        : `/users?limit=10`;
      const res = await apiRequest(url);
      if (res.success && res.data?.users) {
        setDirectoryUsers(res.data.users);
      }
    } catch {
      // ignore
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleOpenNewChatModal = () => {
    setShowNewChatModal(true);
    setUserSearchTerm('');
    fetchDirectoryUsers('');
  };

  const handleSearchUsersChange = (e) => {
    const term = e.target.value;
    setUserSearchTerm(term);
    fetchDirectoryUsers(term);
  };

  const handleStartChatWithCitizen = async (citizen) => {
    try {
      const res = await apiRequest('/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientId: citizen._id }),
      });
      if (res.success && res.data?.conversation) {
        setActiveConv(res.data.conversation);
        fetchConversations(res.data.conversation._id);
        setShowNewChatModal(false);
      }
    } catch (err) {
      alert(err.message || 'Could not start conversation with this citizen');
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return (
      conv.participants.find((p) => p._id !== user?._id) ||
      conv.participants[0]
    );
  };

  const otherUser = getOtherParticipant(activeConv);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!convFilter.trim()) return true;
    const other = getOtherParticipant(conv);
    const searchLow = convFilter.toLowerCase();
    const nameMatch = other?.name?.toLowerCase().includes(searchLow);
    const textMatch = conv.lastMessageText?.toLowerCase().includes(searchLow);
    const locMatch = other?.location?.toLowerCase().includes(searchLow);
    return nameMatch || textMatch || locMatch;
  });

  return (
    <div className="messages-page-root">
      <div className="container messages-page-layout">
        <LeftSidebar />
        <div className="messages-center-wrapper">
          <div className="messages-top-bar">
            <BackButton fallback="/feed" label="Back to Feed" />
            <h2 className="messages-page-heading">Civic Messages & Coordination</h2>
          </div>
          <div className="messages-container">
            {/* Left Column: Conversations List */}
            <aside
              className={`conversations-sidebar ${
                activeConv ? 'hide-mobile-view' : ''
              }`}
            >
          <div className="conv-header">
            <div className="conv-header-top">
              <h2>Messages</h2>
              <button
                className="btn btn-primary btn-sm btn-new-chat"
                onClick={handleOpenNewChatModal}
                title="Start a new message with any citizen"
              >
                <Plus size={16} />
                <span>New Chat</span>
              </button>
            </div>

            {/* Conversation Search Bar */}
            <div className="conv-search-wrap">
              <Search size={15} className="conv-search-icon" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={convFilter}
                onChange={(e) => setConvFilter(e.target.value)}
                className="conv-search-input"
              />
              {convFilter && (
                <button
                  className="conv-search-clear"
                  onClick={() => setConvFilter('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="conversations-scroll-list">
            {loading ? (
              <div className="conv-loading">
                <div className="spinner" />
                <p>Loading conversations...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = activeConv?._id === conv._id;

                return (
                  <div
                    key={conv._id}
                    className={`conv-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveConv(conv)}
                  >
                    <div className="conv-avatar-wrap">
                      {other?.avatar ? (
                        <img
                          src={other.avatar}
                          alt={other.name}
                          className="conv-avatar"
                        />
                      ) : (
                        <div className="conv-placeholder">
                          {other?.name ? other.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                      )}
                      <span className="online-indicator-dot" />
                      {conv.unreadCount > 0 && (
                        <span className="conv-unread-badge">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="conv-meta">
                      <div className="conv-meta-row">
                        <span className="conv-name">
                          {other?.name || 'Citizen'}
                        </span>
                        <span className="conv-time">
                          {new Date(conv.lastMessageAt).toLocaleDateString(
                            'en-IN',
                            { month: 'short', day: 'numeric' }
                          )}
                        </span>
                      </div>
                      <p className="conv-snippet">
                        {conv.lastMessageText || 'Conversation opened'}
                      </p>
                      {other?.location && (
                        <span className="conv-location-pill">
                          <MapPin size={10} />
                          {other.location}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-conversations">
                <MessageSquare size={36} color="#94a3b8" />
                <p>No conversations found.</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleOpenNewChatModal}
                >
                  <Plus size={15} /> Find Citizen to Chat
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Chat Thread Area */}
        <main
          className={`chat-main-area ${
            !activeConv ? 'hide-mobile-view' : ''
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button
                  className="btn-back-conv"
                  onClick={() => setActiveConv(null)}
                  aria-label="Back to messages list"
                >
                  <ArrowLeft size={19} />
                </button>

                <div className="chat-recipient-info">
                  <div className="chat-avatar-wrap">
                    {otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="chat-avatar"
                      />
                    ) : (
                      <div className="chat-placeholder">
                        {otherUser?.name
                          ? otherUser.name.charAt(0).toUpperCase()
                          : 'C'}
                      </div>
                    )}
                    <span className="chat-online-badge" />
                  </div>

                  <div className="chat-header-text">
                    <div className="chat-name-row">
                      <span className="chat-recipient-name">
                        {otherUser?.name || 'Citizen'}
                      </span>
                      {otherUser?.role === 'admin' && (
                        <span className="badge badge-verified">Admin</span>
                      )}
                    </div>
                    <span className="chat-recipient-loc">
                      <span className="status-live-dot" /> Active in{' '}
                      {otherUser?.location || 'Jharkhand, India'}
                    </span>
                  </div>
                </div>

                <div className="chat-header-actions">
                  {otherUser?._id && (
                    <Link
                      to={`/profile/${otherUser._id}`}
                      className="btn btn-outline btn-sm btn-view-profile"
                    >
                      <User size={14} />
                      <span className="hide-mobile">Profile</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="chat-messages-wrap">
                {messages.length > 0 ? (
                  messages.map((msg, idx) => {
                    const isMine =
                      msg.sender?._id === user?._id ||
                      msg.sender === user?._id;

                    const formattedTime = new Date(msg.createdAt).toLocaleTimeString(
                      [],
                      { hour: '2-digit', minute: '2-digit' }
                    );

                    return (
                      <div
                        key={msg._id || idx}
                        className={`message-bubble-row ${
                          isMine ? 'mine' : 'theirs'
                        }`}
                      >
                        <div className="message-bubble">
                          <p>{msg.body}</p>
                          <div className="message-meta-footer">
                            <span className="message-timestamp">
                              {formattedTime}
                            </span>
                            {isMine && (
                              <span
                                className="msg-receipt-icon"
                                title={msg.readAt ? 'Delivered & Read' : 'Sent'}
                              >
                                {msg.readAt ? (
                                  <CheckCheck size={14} color="#93c5fd" />
                                ) : (
                                  <Check size={13} color="#e2e8f0" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-messages-notice">
                    <Sparkles size={32} color="#16a34a" />
                    <h4>Direct Civic Coordination</h4>
                    <p>
                      This is the beginning of your private direct message thread
                      with <strong>{otherUser?.name}</strong>.
                    </p>
                    <p className="no-messages-sub">
                      Use the quick prompts below or type a message to start collaborating!
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Civic Starters Bar */}
              <div className="quick-starters-bar">
                <span className="starters-label">Suggestions:</span>
                <div className="starters-scroll">
                  {QUICK_STARTERS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      className="starter-chip"
                      onClick={() => setNewMsgText(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Composer */}
              <form
                className="chat-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  type="text"
                  placeholder={`Message ${otherUser?.name || 'citizen'}...`}
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  className="chat-input"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMsgText.trim() || sending}
                  className="btn btn-primary chat-send-btn"
                  title="Send Message"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="select-conversation-prompt">
              <div className="prompt-illustration">
                <MessageSquare size={54} color="#16a34a" />
              </div>
              <h3>Civic Messaging & Coordination</h3>
              <p>
                Connect directly with fellow citizens across Jharkhand to coordinate field evidence, verify community problems, and plan collective solutions.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleOpenNewChatModal}
              >
                <Plus size={16} /> Start a New Conversation
              </button>
            </div>
          )}
        </main>
      </div>
      </div>
    </div>

      {/* New Chat / Citizen Directory Modal */}
      {showNewChatModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowNewChatModal(false)}
        >
          <div
            className="modal-content new-chat-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">New Conversation</h3>
              <button
                className="btn-close"
                onClick={() => setShowNewChatModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body new-chat-modal-body">
              <div className="directory-search-box">
                <Search size={16} className="directory-search-icon" />
                <input
                  type="text"
                  placeholder="Search by citizen name or district (e.g. Ranchi, Dumka)..."
                  value={userSearchTerm}
                  onChange={handleSearchUsersChange}
                  className="directory-search-input"
                  autoFocus
                />
              </div>

              <div className="directory-list-label">
                {userSearchTerm.trim()
                  ? `Search Results (${directoryUsers.length})`
                  : 'Active Citizens in Jharkhand'}
              </div>

              <div className="directory-users-list">
                {searchingUsers ? (
                  <div className="directory-loading">
                    <div className="spinner" />
                    <span>Searching citizens...</span>
                  </div>
                ) : directoryUsers.length > 0 ? (
                  directoryUsers.map((cit) => (
                    <div key={cit._id} className="directory-user-card">
                      <div className="directory-user-left">
                        {cit.avatar ? (
                          <img
                            src={cit.avatar}
                            alt={cit.name}
                            className="directory-avatar"
                          />
                        ) : (
                          <div className="directory-avatar-placeholder">
                            {cit.name ? cit.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                        )}
                        <div className="directory-user-info">
                          <div className="directory-user-name-row">
                            <strong>{cit.name}</strong>
                            {cit.role === 'admin' && (
                              <span className="badge badge-verified">Admin</span>
                            )}
                          </div>
                          <span className="directory-location">
                            <MapPin size={11} />
                            {cit.location || 'Jharkhand, India'}
                          </span>
                          {cit.bio && (
                            <p className="directory-bio-snippet">{cit.bio}</p>
                          )}
                        </div>
                      </div>

                      <button
                        className="btn btn-primary btn-sm btn-chat-now"
                        onClick={() => handleStartChatWithCitizen(cit)}
                      >
                        <MessageSquare size={14} />
                        <span>Chat</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="directory-empty">
                    <p>No citizens matched "{userSearchTerm}".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
