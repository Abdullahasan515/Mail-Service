
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let users = [];
let messages = [];
let nextUserId = 1;
let nextMessageId = 1;

function findUserByEmail(email) {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  if (findUserByEmail(email)) {
    return res.status(400).json({ message: 'Email is already registered.' });
  }

  const newUser = {
    id: nextUserId++,
    name,
    email,
    password,
    createdAt: new Date()
  };
  users.push(newUser);

  return res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email
  });
});

app.get('/api/messages/inbox', (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  if (!userId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  const inbox = messages
    .filter(m => m.receiverId === userId && !m.deletedByReceiver)
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json(inbox);
});

app.get('/api/messages/sent', (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  if (!userId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  const sent = messages
    .filter(m => m.senderId === userId && !m.deletedBySender)
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json(sent);
});

app.get('/api/messages/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const message = messages.find(m => m.id === id);
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }
  res.json(message);
});

app.post('/api/messages', (req, res) => {
  const { senderId, receiverEmail, subject, body } = req.body;

  if (!senderId || !receiverEmail || !subject || !body) {
    return res.status(400).json({ message: 'senderId, receiverEmail, subject and body are required.' });
  }

  const sender = users.find(u => u.id === senderId);
  if (!sender) {
    return res.status(400).json({ message: 'Sender not found.' });
  }

  const receiver = findUserByEmail(receiverEmail);
  if (!receiver) {
    return res.status(400).json({ message: 'Receiver email is not registered.' });
  }

  const newMessage = {
    id: nextMessageId++,
    senderId: sender.id,
    senderEmail: sender.email,
    senderName: sender.name,
    receiverId: receiver.id,
    receiverEmail: receiver.email,
    subject,
    body,
    isRead: false,
    deletedBySender: false,
    deletedByReceiver: false,
    createdAt: new Date()
  };

  messages.push(newMessage);

  res.status(201).json(newMessage);
});

app.patch('/api/messages/:id/read', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId } = req.body;

  const message = messages.find(m => m.id === id);
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }

  if (message.receiverId !== userId) {
    return res.status(403).json({ message: 'Only receiver can mark message as read.' });
  }

  message.isRead = true;
  res.json({ message: 'Message marked as read.', data: message });
});

app.delete('/api/messages/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId } = req.body;

  const message = messages.find(m => m.id === id);
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }

  if (message.senderId === userId) {
    message.deletedBySender = true;
  } else if (message.receiverId === userId) {
    message.deletedByReceiver = true;
  } else {
    return res.status(403).json({ message: 'You are not allowed to delete this message.' });
  }

  res.json({ message: 'Message deleted (soft delete).', data: message });
});

app.get('/', (req, res) => {
  res.send('Mini Cloud Mail Service backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
