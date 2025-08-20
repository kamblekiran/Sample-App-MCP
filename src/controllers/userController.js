// In-memory database for demo purposes
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' }
];

// Get all users
exports.getUsers = (req, res) => {
  res.status(200).json(users);
};

// Get user by ID
exports.getUserById = (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.status(200).json(user);
};

// Create a new user
exports.createUser = (req, res) => {
  const { name, email } = req.body;
  
  // Simple validation
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  
  // Create new user
  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser = { id: newId, name, email };
  
  users.push(newUser);
  res.status(201).json(newUser);
};