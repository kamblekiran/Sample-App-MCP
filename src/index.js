const express = require('express');
const morgan = require('morgan');
const winston = require('winston');
const routes = require('./routes');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// Create Express application
const app = express();
const PORT = process.env.PORT || 8080; // Using 8080 as default for containerized apps

// Middleware
app.use(express.json());
app.use(morgan('combined'));

// Get Kubernetes information if available
const getKubernetesInfo = () => {
  return {
    namespace: process.env.KUBERNETES_NAMESPACE || 'unknown',
    podName: process.env.HOSTNAME || 'local',
    podIp: process.env.POD_IP || '127.0.0.1',
    nodeIp: process.env.NODE_IP || 'unknown'
  };
};

// Routes
app.use('/api', routes);

// Health check endpoint (for K8s probes)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe endpoint (for K8s probes)
app.get('/ready', (req, res) => {
  res.status(200).json({ 
    status: 'READY', 
    timestamp: new Date().toISOString()
  });
});

// Kubernetes info endpoint
app.get('/k8sinfo', (req, res) => {
  res.status(200).json(getKubernetesInfo());
});

// Root endpoint - enhanced for AKS demo
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'DevOps Demo Application',
    description: 'Express.js application for AKS deployment demo',
    kubernetes: getKubernetesInfo(),
    endpoints: [
      'GET / - This information',
      'GET /health - Health check (for liveness probe)',
      'GET /ready - Readiness check (for readiness probe)',
      'GET /k8sinfo - Kubernetes information',
      'GET /api/users - Get all users',
      'GET /api/users/:id - Get user by ID',
      'POST /api/users - Create a new user'
    ],
    timestamp: new Date().toISOString()
  });
});

// Visual UI endpoint - simple HTML for browser testing
app.get('/ui', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DevOps Demo App</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .btn { background-color: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        pre { background-color: #f8f9fa; padding: 12px; border-radius: 4px; overflow-x: auto; }
        #usersList { list-style-type: none; padding: 0; }
        #usersList li { padding: 8px; border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>
      <h1>DevOps Demo Application</h1>
      <div class="card">
        <h2>Kubernetes Information</h2>
        <pre id="k8sInfo">Loading...</pre>
      </div>
      <div class="card">
        <h2>Users</h2>
        <ul id="usersList">Loading users...</ul>
        <button class="btn" id="loadUsersBtn">Refresh Users</button>
      </div>
      <div class="card">
        <h2>Add New User</h2>
        <form id="addUserForm">
          <div style="margin-bottom: 10px;">
            <label for="name">Name:</label>
            <input type="text" id="name" required>
          </div>
          <div style="margin-bottom: 10px;">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
          </div>
          <button type="submit" class="btn">Add User</button>
        </form>
      </div>
      
      <script>
        // Fetch Kubernetes info
        fetch('/k8sinfo')
          .then(response => response.json())
          .then(data => {
            document.getElementById('k8sInfo').textContent = JSON.stringify(data, null, 2);
          })
          .catch(error => {
            document.getElementById('k8sInfo').textContent = 'Error fetching Kubernetes info: ' + error.message;
          });
        
        // Load users function
        function loadUsers() {
          fetch('/api/users')
            .then(response => response.json())
            .then(users => {
              const usersList = document.getElementById('usersList');
              usersList.innerHTML = '';
              users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = \`\${user.name} (\${user.email}) - ID: \${user.id}\`;
                usersList.appendChild(li);
              });
            })
            .catch(error => {
              document.getElementById('usersList').innerHTML = '<li>Error loading users: ' + error.message + '</li>';
            });
        }
        
        // Load users on page load
        loadUsers();
        
        // Add event listener for refresh button
        document.getElementById('loadUsersBtn').addEventListener('click', loadUsers);
        
        // Add event listener for form submission
        document.getElementById('addUserForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const name = document.getElementById('name').value;
          const email = document.getElementById('email').value;
          
          fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email }),
          })
          .then(response => response.json())
          .then(data => {
            loadUsers(); // Reload the users list
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            alert('User added successfully!');
          })
          .catch(error => {
            alert('Error adding user: ' + error.message);
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Try accessing http://localhost:${PORT}/ or http://localhost:${PORT}/ui`);
  });
}

module.exports = app; // Export for testing