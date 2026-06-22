import { useState } from 'react';
import { Mail, Lock, User, MessageSquareCode, Loader2, KeyRound, ArrowLeft } from 'lucide-react';

function Login({ loginSuccess, addToast, apiCall }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  // Step 1: Submit Login or Initial Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (isRegister && data.requiresVerification) {
        // Move to OTP input screen
        setTempEmail(data.email);
        setShowOtp(true);
        addToast('Verification OTP sent to your email!', 'success');
      } else {
        // Direct login (for regular logins)
        loginSuccess(data.token, data.user);
      }
    } catch (err) {
      addToast(err.message || 'Authentication failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      addToast('Please enter a valid 6-digit verification code.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await apiCall('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: tempEmail, otp: otp.trim() })
      });
      
      // OTP matched. Account activated!
      loginSuccess(data.token, data.user);
      setShowOtp(false);
      setOtp('');
    } catch (err) {
      addToast(err.message || 'OTP verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to re-send OTP
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email: tempEmail, password })
      });
      addToast('A new verification code has been sent!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to resend verification code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // UI rendering based on showOtp state
  if (showOtp) {
    return (
      <div className="auth-page">
        <div className="auth-card fade-in">
          <div className="auth-header">
            <div className="auth-logo" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
              <KeyRound size={28} />
            </div>
            <h1>Verify Your Email</h1>
            <p>We've sent a 6-digit OTP code to <strong style={{ color: 'var(--secondary)' }}>{tempEmail}</strong></p>
          </div>

          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <div className="input-wrapper">
                <KeyRound className="input-icon" size={18} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only digits
                  disabled={loading}
                  style={{ letterSpacing: '4px', fontSize: '16px', fontWeight: 'bold' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="form-submit-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Verifying...
                </span>
              ) : (
                'Verify Account'
              )}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px', fontSize: '13px' }}>
            <span 
              className="auth-link" 
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => {
                setShowOtp(false);
                setOtp('');
              }}
            >
              <ArrowLeft size={14} /> Back
            </span>

            <span className="auth-link" onClick={handleResendOtp}>
              Resend OTP
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Standard Login/Register forms
  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <MessageSquareCode size={28} />
          </div>
          <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p>
            {isRegister 
              ? 'Sign up to submit and track feedback' 
              : 'Log in to manage your feedback and analytics'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="form-submit-btn" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </span>
            ) : (
              isRegister ? 'Register & Verify' : 'Log In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <span className="auth-link" onClick={() => setIsRegister(false)}>
                Sign In
              </span>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <span className="auth-link" onClick={() => setIsRegister(true)}>
                Register
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
