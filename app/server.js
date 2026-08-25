const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const promBundle = require('express-prom-bundle');
const responseTime = require('response-time');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Monitoring imports
const { register, logger } = require('./config/monitoring');
const { metricsMiddleware, trackDbOperation, trackRegistration, trackLogin } = require('./middleware/metrics');
const { requestLogger, errorLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './database.sqlite';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Log startup
logger.info('Starting AI Tools Hub Server...', { port: PORT, dbPath: DB_PATH });

// ===================================
// DATABASE SETUP
// ===================================

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        logger.error('Error opening database', { error: err.message });
    } else {
        logger.info('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    const start = Date.now();

    // Create users table
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      studentId TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
        const duration = (Date.now() - start) / 1000;
        trackDbOperation('CREATE_TABLE', 'users', duration);

        if (err) {
            logger.error('Error creating users table', { error: err.message });
        } else {
            logger.info('Users table ready');
        }
    });

    // Create chat conversations table
    db.run(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT DEFAULT 'New Conversation',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `, (err) => {
        if (err) {
            logger.error('Error creating chat_conversations table', { error: err.message });
        } else {
            logger.info('Chat conversations table ready');
        }
    });

    // Create chat messages table
    db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversationId INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversationId) REFERENCES chat_conversations(id)
    )
  `, (err) => {
        if (err) {
            logger.error('Error creating chat_messages table', { error: err.message });
        } else {
            logger.info('Chat messages table ready');
        }
    });
}

// ===================================
// MIDDLEWARE
// ===================================

// Response time tracking
app.use(responseTime());

// Request logging (before other middleware)
app.use(requestLogger);

// Prometheus metrics bundle (automatic HTTP metrics)
app.use(promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    customLabels: { app: 'ai-hub' },
    promClient: { collectDefaultMetrics: {} }
}));

// Custom metrics middleware
app.use(metricsMiddleware);

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Important for Docker/localhost
    },
    name: 'ai-hub.sid' // Custom session cookie name
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// ===================================
// HEALTH CHECK & METRICS ENDPOINTS
// ===================================

// Basic health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Detailed health check with database connectivity
app.get('/api/health/detailed', (req, res) => {
    const start = Date.now();

    db.get('SELECT 1', (err) => {
        const dbLatency = Date.now() - start;

        if (err) {
            logger.error('Database health check failed', { error: err.message });
            return res.status(503).json({
                status: 'unhealthy',
                database: 'disconnected',
                error: err.message,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            status: 'healthy',
            database: 'connected',
            dbLatency: `${dbLatency}ms`,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
    });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (err) {
        logger.error('Error generating metrics', { error: err.message });
        res.status(500).end(err.message);
    }
});

// ===================================
// API ROUTES
// ===================================

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { fullName, studentId, email, password } = req.body;

    // Validation
    if (!fullName || !studentId || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    if (fullName.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Full name must be at least 2 characters'
        });
    }

    if (studentId.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Student ID must be at least 3 characters'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters'
        });
    }

    try {
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user into database
        const dbStart = Date.now();
        db.run(
            'INSERT INTO users (fullName, studentId, email, passwordHash) VALUES (?, ?, ?, ?)',
            [fullName, studentId, email, passwordHash],
            function (err) {
                const dbDuration = (Date.now() - dbStart) / 1000;
                trackDbOperation('INSERT', 'users', dbDuration);

                if (err) {
                    trackRegistration(false);
                    logger.warn('Registration failed', {
                        email,
                        studentId,
                        error: err.message,
                        correlationId: req.correlationId
                    });

                    if (err.message.includes('UNIQUE constraint failed')) {
                        if (err.message.includes('email')) {
                            return res.status(400).json({
                                success: false,
                                message: 'Email already registered'
                            });
                        } else if (err.message.includes('studentId')) {
                            return res.status(400).json({
                                success: false,
                                message: 'Student ID already registered'
                            });
                        }
                    }
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating user'
                    });
                }

                trackRegistration(true);
                logger.info('User registered successfully', {
                    userId: this.lastID,
                    email,
                    correlationId: req.correlationId
                });

                res.json({
                    success: true,
                    message: 'Registration successful',
                    userId: this.lastID
                });
            }
        );
    } catch (error) {
        trackRegistration(false);
        logger.error('Registration error', {
            error: error.message,
            stack: error.stack,
            correlationId: req.correlationId
        });
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    // Find user by email
    const dbStart = Date.now();
    db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, user) => {
            const dbDuration = (Date.now() - dbStart) / 1000;
            trackDbOperation('SELECT', 'users', dbDuration);

            if (err) {
                trackLogin(false);
                logger.error('Database error during login', {
                    error: err.message,
                    correlationId: req.correlationId
                });
                return res.status(500).json({
                    success: false,
                    message: 'Server error during login'
                });
            }

            if (!user) {
                trackLogin(false);
                logger.warn('Login failed - user not found', {
                    email,
                    correlationId: req.correlationId
                });
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            try {
                // Verify password
                const passwordMatch = await bcrypt.compare(password, user.passwordHash);

                if (!passwordMatch) {
                    trackLogin(false);
                    logger.warn('Login failed - invalid password', {
                        email,
                        correlationId: req.correlationId
                    });
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                    });
                }

                // Set session
                req.session.userId = user.id;
                req.session.fullName = user.fullName;
                req.session.email = user.email;

                trackLogin(true);
                logger.info('User logged in successfully', {
                    userId: user.id,
                    email: user.email,
                    correlationId: req.correlationId
                });

                res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        studentId: user.studentId
                    }
                });
            } catch (error) {
                trackLogin(false);
                logger.error('Login error', {
                    error: error.message,
                    stack: error.stack,
                    correlationId: req.correlationId
                });
                res.status(500).json({
                    success: false,
                    message: 'Server error during login'
                });
            }
        }
    );
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    const userId = req.session.userId;

    req.session.destroy((err) => {
        if (err) {
            logger.error('Logout error', {
                error: err.message,
                userId,
                correlationId: req.correlationId
            });
            return res.status(500).json({
                success: false,
                message: 'Error during logout'
            });
        }

        logger.info('User logged out', {
            userId,
            correlationId: req.correlationId
        });

        res.json({
            success: true,
            message: 'Logout successful'
        });
    });
});

// Check session endpoint
app.get('/api/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            isLoggedIn: true,
            user: {
                id: req.session.userId,
                fullName: req.session.fullName,
                email: req.session.email
            }
        });
    } else {
        res.json({
            success: true,
            isLoggedIn: false
        });
    }
});

// ===================================
// CHAT API ENDPOINTS
// ===================================

// Create new conversation
app.post('/api/chat/conversation', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    const userId = req.session.userId;
    const title = req.body.title || 'New Conversation';

    db.run(
        'INSERT INTO chat_conversations (userId, title) VALUES (?, ?)',
        [userId, title],
        function (err) {
            if (err) {
                logger.error('Error creating conversation', { error: err.message });
                return res.status(500).json({
                    success: false,
                    message: 'Error creating conversation'
                });
            }

            res.json({
                success: true,
                conversationId: this.lastID
            });
        }
    );
});

// Get user's conversations
app.get('/api/chat/conversations', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    const userId = req.session.userId;

    db.all(
        'SELECT * FROM chat_conversations WHERE userId = ? ORDER BY updatedAt DESC',
        [userId],
        (err, conversations) => {
            if (err) {
                logger.error('Error fetching conversations', { error: err.message });
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching conversations'
                });
            }

            res.json({
                success: true,
                conversations
            });
        }
    );
});

// Get conversation messages
app.get('/api/chat/conversation/:id/messages', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    const conversationId = req.params.id;
    const userId = req.session.userId;

    // Verify conversation belongs to user
    db.get(
        'SELECT * FROM chat_conversations WHERE id = ? AND userId = ?',
        [conversationId, userId],
        (err, conversation) => {
            if (err || !conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            // Get messages
            db.all(
                'SELECT * FROM chat_messages WHERE conversationId = ? ORDER BY createdAt ASC',
                [conversationId],
                (err, messages) => {
                    if (err) {
                        logger.error('Error fetching messages', { error: err.message });
                        return res.status(500).json({
                            success: false,
                            message: 'Error fetching messages'
                        });
                    }

                    res.json({
                        success: true,
                        messages
                    });
                }
            );
        }
    );
});

// Send chat message
app.post('/api/chat/message', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    const { conversationId, message } = req.body;
    const userId = req.session.userId;

    if (!message || !message.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Message cannot be empty'
        });
    }

    try {
        // Verify conversation belongs to user
        const conversation = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM chat_conversations WHERE id = ? AND userId = ?',
                [conversationId, userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Save user message
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO chat_messages (conversationId, role, content) VALUES (?, ?, ?)',
                [conversationId, 'user', message],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Get conversation history
        const messages = await new Promise((resolve, reject) => {
            db.all(
                'SELECT role, content FROM chat_messages WHERE conversationId = ? ORDER BY createdAt ASC',
                [conversationId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        // Build conversation history for Gemini
        // Gemini uses a different format - we need to convert the messages
        let conversationHistory = '';
        messages.forEach(msg => {
            if (msg.role === 'user') {
                conversationHistory += `User: ${msg.content}\n\n`;
            } else if (msg.role === 'assistant') {
                conversationHistory += `Assistant: ${msg.content}\n\n`;
            }
        });

        // Call Gemini AI API
        const chat = model.startChat({
            history: messages.slice(0, -1).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })),
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const assistantMessage = response.text();

        // Save assistant response
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO chat_messages (conversationId, role, content) VALUES (?, ?, ?)',
                [conversationId, 'assistant', assistantMessage],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Update conversation timestamp
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE chat_conversations SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
                [conversationId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        logger.info('Chat message processed', {
            userId,
            conversationId,
            messageLength: message.length,
            responseLength: assistantMessage.length
        });

        res.json({
            success: true,
            message: assistantMessage
        });

    } catch (error) {
        logger.error('Chat error', {
            error: error.message,
            stack: error.stack,
            userId,
            conversationId
        });

        res.status(500).json({
            success: false,
            message: error.message.includes('API key')
                ? 'Gemini API key not configured'
                : 'Error processing chat message'
        });
    }
});

// Delete conversation
app.delete('/api/chat/conversation/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    const conversationId = req.params.id;
    const userId = req.session.userId;

    // Verify conversation belongs to user
    db.get(
        'SELECT * FROM chat_conversations WHERE id = ? AND userId = ?',
        [conversationId, userId],
        (err, conversation) => {
            if (err || !conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            // Delete messages first
            db.run(
                'DELETE FROM chat_messages WHERE conversationId = ?',
                [conversationId],
                (err) => {
                    if (err) {
                        logger.error('Error deleting messages', { error: err.message });
                        return res.status(500).json({
                            success: false,
                            message: 'Error deleting conversation'
                        });
                    }

                    // Delete conversation
                    db.run(
                        'DELETE FROM chat_conversations WHERE id = ?',
                        [conversationId],
                        (err) => {
                            if (err) {
                                logger.error('Error deleting conversation', { error: err.message });
                                return res.status(500).json({
                                    success: false,
                                    message: 'Error deleting conversation'
                                });
                            }

                            res.json({
                                success: true,
                                message: 'Conversation deleted'
                            });
                        }
                    );
                }
            );
        }
    );
});

// ===================================
// SERVE HTML PAGES
// ===================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, 'chatbot.html'));
});

// Error handling middleware (must be last)
app.use(errorLogger);

// ===================================
// START SERVER
// ===================================

app.listen(PORT, () => {
    logger.info('AI Tools Hub Server started successfully', {
        port: PORT,
        database: DB_PATH,
        environment: process.env.NODE_ENV || 'development'
    });

    console.log(`\n🚀 AI Tools Hub Server Running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    console.log('\n\nShutting down gracefully...');

    db.close((err) => {
        if (err) {
            logger.error('Error closing database', { error: err.message });
        } else {
            logger.info('Database connection closed');
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
