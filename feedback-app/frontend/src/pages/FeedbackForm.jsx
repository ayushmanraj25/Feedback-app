import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';

const CATEGORIES = ['Bug', 'Feature Request', 'General', 'Other'];

function FeedbackForm({ onFeedbackAdded, addToast, apiCall }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Bug');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      addToast('Please fill out all fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiCall('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ title, description, category, rating })
      });
      addToast('Feedback submitted successfully! Thank you.', 'success');
      
      // Reset form fields
      setTitle('');
      setDescription('');
      setCategory('Bug');
      setRating(5);

      // Invoke dashboard reload callback
      onFeedbackAdded(data);
    } catch (err) {
      addToast(err.message || 'Failed to submit feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-form-card">
      <h2>Submit Feedback</h2>
      <p>Help us improve by describing bugs, requesting features, or expressing suggestions.</p>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '16px' }}
            placeholder="Summarize your feedback..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            maxLength={80}
            required
          />
        </div>
        {/* Category */}
        <div className="form-group">
          <label className="form-label">Category</label>
          <div className="select-wrapper">
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Rating Star Selection */}
        <div className="form-group">
          <label className="form-label">Overall Rating</label>
          <div className="star-rating-container">
            {[1, 2, 3, 4, 5].map((starValue) => {
              const isActive = hoverRating ? starValue <= hoverRating : starValue <= rating;
              return (
                <button
                  type="button"
                  key={starValue}
                  className={`star-btn ${isActive ? 'filled' : ''}`}
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={submitting}
                >
                  <Star fill={isActive ? 'currentColor' : 'none'} size={24} />
                </button>
              );
            })}
          </div>
        </div>
        {/* Description */}
        <div className="form-group">
          <label className="form-label">Details</label>
          <textarea
            className="form-textarea"
            placeholder="Provide a detailed description here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        {/* Submit */}
        <button type="submit" className="form-submit-btn" disabled={submitting}>
          {submitting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Submitting...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Send size={16} />
              Submit Feedback
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
export default FeedbackForm;
