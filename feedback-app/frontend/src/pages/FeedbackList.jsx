import { useState } from 'react';
import { 
  Star, 
  Search, 
  MessageSquare, 
  CornerDownRight, 
  Trash2, 
  Send,
  Inbox,
  Filter
} from 'lucide-react';
const CATEGORIES = ['All', 'Bug', 'Feature Request', 'General', 'Other'];
const STATUSES = ['All', 'Pending', 'Under Review', 'Planned', 'Completed'];
function FeedbackList({ 
  feedbacks, 
  loading, 
  user, 
  onFeedbackUpdated, 
  onFeedbackDeleted, 
  addToast, 
  apiCall,
  isMySubmissions = false 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [repliesTexts, setRepliesTexts] = useState({}); // Stores reply draft for each feedback ID
  const [submittingReply, setSubmittingReply] = useState({});
  const [showAll, setShowAll] = useState(false);

  // Client-side filtering logic
  const filteredFeedbacks = feedbacks.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });
  // Limit shown items to 3 by default
  const itemsToShow = showAll ? filteredFeedbacks : filteredFeedbacks.slice(0, 3);
  // Admin action: Change status
  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await apiCall(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      addToast(`Status updated to "${newStatus}"`, 'success');
      onFeedbackUpdated(updated);
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };
  // Admin action: Submit reply
  const handleReplySubmit = async (e, id) => {
    e.preventDefault();
    const text = repliesTexts[id];
    if (!text || text.trim() === '') return;

    setSubmittingReply(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await apiCall(`/api/feedback/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      addToast('Reply posted successfully.', 'success');
      setRepliesTexts(prev => ({ ...prev, [id]: '' }));
      onFeedbackUpdated(updated);
    } catch (err) {
      addToast(err.message || 'Failed to post reply.', 'error');
    } finally {
      setSubmittingReply(prev => ({ ...prev, [id]: false }));
    }
  };

  // Admin action: Delete feedback
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback item? This action is permanent.')) {
      return;
    }

    try {
      await apiCall(`/api/feedback/${id}`, { method: 'DELETE' });
      addToast('Feedback deleted successfully.', 'success');
      onFeedbackDeleted(id);
    } catch (err) {
      addToast(err.message || 'Failed to delete feedback.', 'error');
    }
  };

  const getCategoryClass = (cat) => {
    switch (cat) {
      case 'Bug': return 'bug';
      case 'Feature Request': return 'feature';
      case 'General': return 'general';
      default: return 'other';
    }
  };
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'pending';
      case 'Under Review': return 'review';
      case 'Planned': return 'planned';
      case 'Completed': return 'completed';
      default: return '';
    }
  };
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <div className="feedback-list-container">
      {/* Header and Search */}
      <div className="feed-header">
        <div className="feed-title-wrapper">
          <h2>{isMySubmissions ? 'My Submissions' : 'Feedback Feed'}</h2>
          <p>
            {isMySubmissions 
              ? 'Check the status of your submitted bugs and suggestions' 
              : 'Browse suggestions, bug reports, and features submitted by users'}
          </p>
        </div>
      </div>
      {/* Filters Toolbar */}
      <div className="filters-bar">
        {/* Search */}
        <div className="search-input-group">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-field"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <select 
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>Category: {cat}</option>
          ))}
        </select>
        {/* Status Filter */}
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map(status => (
            <option key={status} value={status}>Status: {status}</option>
          ))}
        </select>
      </div>
      {/* Loading state */}
      {loading ? (
        <div className="empty-state">
          <p>Loading feedbacks list...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        /* Empty Feed */
        <div className="empty-state fade-in">
          <Inbox className="empty-state-icon" size={36} />
          <h3>No feedbacks found</h3>
          <p>Try adjusting your search criteria or category filters.</p>
        </div>
      ) : (
        /* Feed Cards */
        <div className="feedback-list">
          {itemsToShow.map((item) => (
            <article key={item.id} className="feedback-card fade-in">
              <div className="card-top">
                <div className="card-badges">
                  <span className={`badge ${getCategoryClass(item.category)}`}>
                    {item.category}
                  </span>
                  <span className={`badge-status ${getStatusClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                
                {/* Stars */}
                <div className="card-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={14} 
                      fill={star <= item.rating ? 'currentColor' : 'none'} 
                    />
                  ))}
                </div>
              </div>

              <h3 className="feedback-title">{item.title}</h3>
              <p className="feedback-desc">{item.description}</p>

              {/* Meta */}
              <div className="card-meta">
                <div className="meta-user">
                  <div className="user-avatar-initial">
                    {item.user ? item.user.charAt(0).toUpperCase() : '?'}
                  </div>
                  <span>Submitted by <strong>{item.user || 'Anonymous'}</strong></span>
                </div>
                <span>{formatDate(item.createdAt)}</span>
              </div>

              {/* Replies Feed */}
              {item.replies && item.replies.length > 0 && (
                <div className="replies-section">
                  <div className="replies-title">
                    <MessageSquare size={13} />
                    <span>Responses ({item.replies.length})</span>
                  </div>
                  {item.replies.map((reply) => (
                    <div key={reply.id} className="reply-card">
                      <div className="reply-header">
                        <span className="reply-user">
                          <CornerDownRight size={11} />
                          {reply.user}
                          <span className="admin-pill" style={{ scale: '0.85', margin: '0' }}>Staff</span>
                        </span>
                        <span className="reply-date">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="reply-body">{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin Actions Panel */}
              {user.role === 'admin' && (
                <div className="admin-card-actions">
                  <div className="admin-actions-row">
                    {/* Status dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="form-label" style={{ margin: 0, fontSize: '11px' }}>Update Status:</span>
                      <select
                        className="admin-status-dropdown"
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Planned">Planned</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    {/* Delete button */}
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(item.id)}
                      title="Delete Feedback"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>

                  {/* Reply form */}
                  <form 
                    onSubmit={(e) => handleReplySubmit(e, item.id)}
                    className="admin-reply-composer"
                  >
                    <input
                      type="text"
                      className="admin-reply-input"
                      placeholder="Type a team response..."
                      value={repliesTexts[item.id] || ''}
                      onChange={(e) => setRepliesTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                      disabled={submittingReply[item.id]}
                      required
                    />
                    <button 
                      type="submit" 
                      className="btn-admin-reply"
                      disabled={submittingReply[item.id] || !repliesTexts[item.id]}
                    >
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              )}
            </article>
          ))}
          {filteredFeedbacks.length > 3 && (
            <button 
              onClick={() => setShowAll(!showAll)} 
              className="btn-show-more"
            >
              {showAll ? 'Show Less' : `View All Feedbacks (${filteredFeedbacks.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export default FeedbackList;
