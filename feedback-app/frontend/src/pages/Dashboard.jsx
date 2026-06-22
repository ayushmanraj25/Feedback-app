import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  FolderHeart, 
  LogOut, 
  BarChart3, 
  Star, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  Sparkles,
  GitBranch
} from 'lucide-react';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';

function Dashboard({ user, logout, addToast, apiCall }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' (Form + List), 'my-submissions'

  // Fetch feedbacks list from api
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/feedback');
      setFeedbacks(data);
    } catch (err) {
      addToast(err.message || 'Error loading feedbacks', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiCall, addToast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Statistics calculation helpers
  const totalCount = feedbacks.length;
  
  const avgRating = totalCount > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1)
    : '0.0';

  const completedCount = feedbacks.filter(f => f.status === 'Completed').length;
  const resolutionRate = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0;

  const pendingCount = feedbacks.filter(f => f.status === 'Pending').length;

  const handleFeedbackAdded = (newFeedback) => {
    setFeedbacks(prev => [newFeedback, ...prev]);
  };

  const handleFeedbackUpdated = (updatedFeedback) => {
    setFeedbacks(prev => prev.map(f => f.id === updatedFeedback.id ? updatedFeedback : f));
  };

  const handleFeedbackDeleted = (deletedId) => {
    setFeedbacks(prev => prev.filter(f => f.id !== deletedId));
  };
  // Filter feedback based on activeTab
  const displayedFeedbacks = activeTab === 'my-submissions'
    ? feedbacks.filter(f => f.userId === user.id)
    : feedbacks;
  return (
    <>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-logo">
            <div className="header-logo-icon">
              <MessageSquare size={18} style={{ color: '#ffffff' }} />
            </div>
            <span>Feedback Portal</span>
          </div>
          <div className="header-user-info">
            <div className="user-badge">
              <UserCheck size={14} style={{ color: 'var(--primary)' }} />
              <span>{user.name}</span>
              {user.role === 'admin' && <span className="admin-pill">Admin</span>}
            </div>
            <button className="btn-logout" onClick={logout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      {/* Main Container */}
      <main className="dashboard-main fade-in">
        {/* Statistics Widgets */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">
              <MessageSquare size={22} />
            </div>
            <div>
              <div className="stat-value">{totalCount}</div>
              <div className="stat-label">Total Feedbacks</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon secondary">
              <Star size={22} />
            </div>
            <div>
              <div className="stat-value">{avgRating} / 5.0</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="stat-value">{resolutionRate}%</div>
              <div className="stat-label">Resolution Rate</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <Clock size={22} />
            </div>
            <div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Pending Reviews</div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="tabs-navigation">
          <button 
            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <LayoutDashboard size={18} />
            All Feedbacks
          </button>
          <button 
            className={`tab-btn ${activeTab === 'my-submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-submissions')}
          >
            <FolderHeart size={18} />
            My Submissions
          </button>
        </nav>

        {/* Dashboard Workspace */}
        <div className="dashboard-content-split">
          {activeTab === 'feed' ? (
            <>
              {/* Form Pane (Left Side) */}
              <div className="dashboard-pane">
                <FeedbackForm 
                  onFeedbackAdded={handleFeedbackAdded} 
                  addToast={addToast} 
                  apiCall={apiCall}
                />
              </div>

              {/* Feed List Pane (Right Side) */}
              <div>
                <FeedbackList 
                  feedbacks={displayedFeedbacks} 
                  loading={loading}
                  user={user}
                  onFeedbackUpdated={handleFeedbackUpdated}
                  onFeedbackDeleted={handleFeedbackDeleted}
                  addToast={addToast}
                  apiCall={apiCall}
                />
              </div>
            </>
          ) : (
            /* My Submissions Pane (Full Width) */
            <div style={{ gridColumn: 'span 2' }}>
              <FeedbackList 
                feedbacks={displayedFeedbacks} 
                loading={loading}
                user={user}
                onFeedbackUpdated={handleFeedbackUpdated}
                onFeedbackDeleted={handleFeedbackDeleted}
                addToast={addToast}
                apiCall={apiCall}
                isMySubmissions={true}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
<footer className="app-footer">
  <div className="footer-content">

    <div className="footer-brand">
      <h1>Feedback Portal</h1>
      <p>Collect, manage, and analyze employee feedback efficiently.</p>
    </div>

    <div className="footer-links">
      <a href="#">Home</a>
      <a href="#">Dashboard</a>
      <a href="#">Feedbacks</a>
      <a href="#">Analytics</a>
    </div>

    <div className="footer-contact">
      <p>📧 support@feedbackportal.com</p>
      <p>📍 Delhi, India</p>
    </div>

  </div>

  <div className="footer-bottom">
    <p> 2026 Feedback Portal. All Rights Reserved.</p>
    <p>Built with React & Express </p>
  </div>
</footer>
    </>
  );
}
export default Dashboard;
