import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_feedback_key_123';

// ES Module dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Initialize and Seed Database if it doesn't exist
const initializeDatabase = async () => {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    console.log('Database file not found. Seeding initial database...');
    
    // Hash default passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('user123', 10);

    const initialData = {
      users: [
        {
          id: 'u1',
          name: 'System Admin',
          email: 'admin@feedback.com',
          password: adminPasswordHash,
          role: 'admin'
        },
        {
          id: 'u2',
          name: 'Jane Doe',
          email: 'user@feedback.com',
          password: userPasswordHash,
          role: 'user'
        }
      ],
      feedbacks: [
        {
          id: 'f1',
          title: 'Mobile navigation drawer cut off on iOS devices',
          description: 'When opening the navigation drawer on iOS Safari, the bottom menu items are hidden behind the system navigation bar. Hard to navigate.',
          category: 'Bug',
          rating: 2,
          user: 'Jane Doe',
          userId: 'u2',
          status: 'Under Review',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          replies: []
        },
        {
          id: 'f2',
          title: 'Add dashboard export functionality (CSV/PDF)',
          description: 'It would be amazing if admins could export feedback analytics and reports to CSV or PDF for presentations and sharing with team members.',
          category: 'Feature Request',
          rating: 5,
          user: 'Alex Smith',
          userId: 'u3',
          status: 'Planned',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          replies: [
            {
              id: 'r1',
              user: 'System Admin',
              userId: 'u1',
              text: 'This is a great suggestion, Alex! We have added this to our Q3 roadmap. We plan to support CSV export first, followed by PDF reports.',
              createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: 'f3',
          title: 'Speed up feedback page load times',
          description: 'The dashboard takes about 3 seconds to render on slow connections. Let\'s optimize rendering and image payloads.',
          category: 'Other',
          rating: 3,
          user: 'Emma Watson',
          userId: 'u4',
          status: 'Completed',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          replies: [
            {
              id: 'r2',
              user: 'System Admin',
              userId: 'u1',
              text: 'We\'ve implemented lazy loading for dashboard metrics and compressed our assets. Page load speeds should now be under 1 second!',
              createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        }
      ]
    };

    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(initialData, null, 2));
    console.log('Database successfully seeded!');
  }
};

await initializeDatabase();

// DB Read/Write Helpers
const readDB = () => {
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return { users: [], feedbacks: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
};

// --- NODEMAILER EMAIL SETUP ---
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const isSmtpConfigured = 
  emailUser && 
  emailUser !== 'your-email@gmail.com' && 
  emailUser.trim() !== '' && 
  emailPass && 
  emailPass !== 'your-gmail-app-password' && 
  emailPass.trim() !== '';

let transporter = null;
if (isSmtpConfigured) {
  console.log(`Mailer initialized in SMTP mode (${process.env.EMAIL_SERVICE || 'gmail'}). Real emails will be sent.`);
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
} else {
  console.log('Mailer initialized in SIMULATION mode. OTP will print to terminal console.');
}

const sendOtpEmail = async (email, otp) => {
  if (isSmtpConfigured && transporter) {
    const mailOptions = {
      from: `"VibeBack Portal" <${emailUser}>`,
      to: email,
      subject: 'VibeBack Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; text-align: center; margin-bottom: 24px;">VibeBack Verification Code</h2>
          <p style="font-size: 16px; color: #334155;">Hello,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Thank you for registering at VibeBack. To complete your account activation, please use the 6-digit verification code below:</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background-color: #f1f5f9; border-radius: 6px; border: 1px solid #cbd5e1; color: #0f172a; display: inline-block;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This OTP is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 20px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 VibeBack. All rights reserved.</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Sent OTP email to ${email}`);
  } else {
    console.log(`\n==================================================\n[EMAIL SIMULATION] OTP code for ${email} is: ${otp}\n==================================================\n`);
  }
};

// In-memory store for pending registrations (Expires in 10 minutes)
const tempRegistrations = new Map();

// Cleanup expired temp registrations every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of tempRegistrations.entries()) {
    if (now > entry.expiresAt) {
      tempRegistrations.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin Middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin privileges required' });
  }
};

// --- AUTHENTICATION ROUTES ---

// Step 1: Register Route - Generates and sends OTP
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const db = readDB();
    const userExists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save temporary details in memory
    tempRegistrations.set(email.toLowerCase(), {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins expiry
    });

    // Send OTP
    await sendOtpEmail(email.toLowerCase(), otp);

    res.status(200).json({
      message: 'OTP sent to email. Verification required.',
      email: email.toLowerCase(),
      requiresVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Step 2: Verify OTP Route - Completes user registration
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const emailKey = email.toLowerCase();
    const entry = tempRegistrations.get(emailKey);

    if (!entry) {
      return res.status(400).json({ message: 'No registration request found for this email. Please register again.' });
    }

    if (Date.now() > entry.expiresAt) {
      tempRegistrations.delete(emailKey);
      return res.status(400).json({ message: 'OTP verification code has expired. Please register again.' });
    }

    if (entry.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    }

    // OTP verified successfully. Save user to database
    const db = readDB();
    const newUser = {
      id: 'u_' + Date.now(),
      name: entry.name,
      email: entry.email,
      password: entry.password,
      role: 'user'
    };

    db.users.push(newUser);
    writeDB(db);

    // Clean up temporary store
    tempRegistrations.delete(emailKey);

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('OTP Verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// --- FEEDBACK ROUTES ---

// Get all feedbacks with filtering/searching
app.get('/api/feedback', (req, res) => {
  try {
    const db = readDB();
    let feedbacksList = [...db.feedbacks];

    const { category, rating, status, search } = req.query;

    if (category && category !== 'All') {
      feedbacksList = feedbacksList.filter(f => f.category === category);
    }

    if (rating && rating !== 'All') {
      feedbacksList = feedbacksList.filter(f => f.rating === parseInt(rating));
    }

    if (status && status !== 'All') {
      feedbacksList = feedbacksList.filter(f => f.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      feedbacksList = feedbacksList.filter(f => 
        f.title.toLowerCase().includes(searchLower) || 
        f.description.toLowerCase().includes(searchLower)
      );
    }

    feedbacksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(feedbacksList);
  } catch (error) {
    console.error('Fetch feedback error:', error);
    res.status(500).json({ message: 'Error retrieving feedbacks' });
  }
});

// Submit a new feedback
app.post('/api/feedback', authenticateToken, (req, res) => {
  try {
    const { title, description, category, rating } = req.body;

    if (!title || !description || !category || !rating) {
      return res.status(400).json({ message: 'All feedback fields are required' });
    }

    const db = readDB();
    const newFeedback = {
      id: 'f_' + Date.now(),
      title,
      description,
      category,
      rating: parseInt(rating),
      user: req.user.name,
      userId: req.user.id,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      replies: []
    };

    db.feedbacks.push(newFeedback);
    writeDB(db);

    res.status(201).json(newFeedback);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Error saving feedback' });
  }
});

// Update feedback status (Admin only)
app.patch('/api/feedback/:id/status', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status field is required' });
    }

    const validStatuses = ['Pending', 'Under Review', 'Planned', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid feedback status' });
    }

    const db = readDB();
    const feedback = db.feedbacks.find(f => f.id === id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = status;
    writeDB(db);

    res.json(feedback);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Error updating feedback status' });
  }
});

// Reply to a feedback (Admin only)
app.post('/api/feedback/:id/reply', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Reply text cannot be empty' });
    }

    const db = readDB();
    const feedback = db.feedbacks.find(f => f.id === id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const newReply = {
      id: 'r_' + Date.now(),
      user: req.user.name,
      userId: req.user.id,
      text,
      createdAt: new Date().toISOString()
    };

    feedback.replies.push(newReply);
    writeDB(db);

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Reply feedback error:', error);
    res.status(500).json({ message: 'Error submitting reply' });
  }
});

// Delete feedback (Admin only)
app.delete('/api/feedback/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const feedbackIndex = db.feedbacks.findIndex(f => f.id === id);

    if (feedbackIndex === -1) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    db.feedbacks.splice(feedbackIndex, 1);
    writeDB(db);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Error deleting feedback' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
