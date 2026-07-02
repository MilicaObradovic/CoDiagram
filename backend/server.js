const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { attachYjsWebSocketServer } = require('./yjs-server/yjs-websocket');
require('dotenv').config();
const app = express();
const server = http.createServer(app);

app.use((req, res, next) => {
    console.log('🟡 Incoming request:', req.method, req.url);
    console.log('🟡 Headers:', req.headers);
    next();
  });
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running!' });
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/diagrams', require('./routes/diagrams'));
app.use('/api/users', require('./routes/users'));


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5001;
attachYjsWebSocketServer(server, { route: '/api/yjs' });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('uncaughtException', (error) => {
    console.log('🔴 Uncaught Exception:', error.message);
});
  
process.on('unhandledRejection', (reason, promise) => {
    console.log('🔴 Unhandled Rejection:', reason);
});
