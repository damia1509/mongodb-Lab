require('dotenv').config(); [cite_start]// Load environment variables [cite: 34]

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt'); [cite_start]// Import bcrypt for hashing [cite: 21]
const jwt = require('jsonwebtoken'); [cite_start]// Import JWT for tokens [cite: 39]

const port = 3000;
const app = express();
app.use(express.json());

let db;

async function connectToMongoDB() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB!");
        db = client.db("testDB");
    } catch (err) {
        console.error("Error:", err);
    }
}
connectToMongoDB();

// --- SECURITY MIDDLEWARE ---

[cite_start]// 1. Verify Token Middleware [cite: 55-67]
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer <token>"

    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden: Invalid token" });
        req.user = user; // Save decoded user info to request
        next();
    });
};

[cite_start]// 2. Check Role Middleware [cite: 68-71]
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: Access denied" });
        }
        next();
    };
};

// --- ROUTES ---

[cite_start]// Customer Registration (UPDATED: Now hashes password) [cite: 23-32]
app.post('/users/register', async (req, res) => {
    try {
        const saltRounds = 10;
        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const newUser = {
            ...req.body,
            password: hashedPassword, // Store hash, NOT plain text
            role: req.body.role || "customer" // Default to customer
        };

        const result = await db.collection('users').insertOne(newUser);
        res.status(201).json({ id: result.insertedId, message: "User registered securely" });
    } catch (err) {
        res.status(400).json({ error: "Registration failed" });
    }
});

[cite_start]// Customer Login (UPDATED: Now returns JWT Token) [cite: 40-51]
app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ email });
        
        // Check if user exists AND password matches hash
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({ token }); // Send token to client
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});

// View Profile (Protected)
app.get('/users/:id', authenticateToken, async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        res.status(400).json({ error: "Invalid user ID" });
    }
});

// --- RIDE ROUTES ---

app.post('/rides', async (req, res) => {
    try {
        const result = await db.collection('rides').insertOne(req.body);
        res.status(201).json({ id: result.insertedId });
    } catch (err) {
        res.status(400).json({ error: "Invalid ride data" });
    }
});

app.get('/rides/:id', async (req, res) => {
    try {
        const ride = await db.collection('rides').findOne({ _id: new ObjectId(req.params.id) });
        if (!ride) return res.status(404).json({ error: "Ride not found" });
        res.status(200).json(ride);
    } catch (err) {
        res.status(400).json({ error: "Invalid ride ID" });
    }
});

app.post('/rides/:id/rate', async (req, res) => {
    const { rating, comment } = req.body;
    try {
        const result = await db.collection('rides').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { rating, comment } }
        );
        if (result.modifiedCount === 0) return res.status(404).json({ error: "Ride not found or already rated" });
        res.status(200).json({ updated: result.modifiedCount });
    } catch (err) {
        res.status(400).json({ error: "Invalid data" });
    }
});

// --- DRIVER ROUTES ---

app.post('/drivers/register', async (req, res) => {
    try {
        // Note: Ideally drivers should also use hashing, but keeping logic simple for now
        const result = await db.collection('drivers').insertOne(req.body);
        res.status(201).json({ id: result.insertedId });
    } catch (err) {
        res.status(400).json({ error: "Registration failed" });
    }
});

app.post('/drivers/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const driver = await db.collection('drivers').findOne({ email, password });
        if (!driver) return res.status(401).json({ error: "Invalid credentials" });
        res.status(200).json(driver);
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

app.patch('/drivers/:id/availability', async (req, res) => {
    try {
        const result = await db.collection('drivers').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { availability: req.body.availability } }
        );
        if (result.modifiedCount === 0) return res.status(404).json({ error: "Driver not found" });
        res.status(200).json({ updated: result.modifiedCount });
    } catch (err) {
        res.status(400).json({ error: "Invalid driver ID or data" });
    }
});

app.patch('/rides/:id/accept', async (req, res) => {
    try {
        const result = await db.collection('rides').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { driver_id: req.body.driver_id, status: "accepted" } }
        );
        if (result.modifiedCount === 0) return res.status(404).json({ error: "Ride not found" });
        res.status(200).json({ updated: result.modifiedCount });
    } catch (err) {
        res.status(400).json({ error: "Invalid ride ID or data" });
    }
});

app.get('/drivers/:id/earnings', async (req, res) => {
    try {
        const rides = await db.collection('rides').find({ driver_id: req.params.id }).toArray();
        const earnings = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
        res.status(200).json({ total_earnings: earnings });
    } catch (err) {
        res.status(400).json({ error: "Failed to calculate earnings" });
    }
});

// --- ADMIN ROUTES (SECURED) ---

// Admin Login (Note: For this lab, you usually reuse users/login if admins are in users table)
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await db.collection('admins').findOne({ username, password });
        if (!admin) return res.status(401).json({ error: "Invalid credentials" });
        res.status(200).json(admin);
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

[cite_start]// Block User (UPDATED: RESTRICTED TO ADMIN) [cite: 74-77]
app.patch('/admin/block/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const userResult = await db.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { blocked: true } }
        );
        const driverResult = await db.collection('drivers').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { blocked: true } }
        );

        if (userResult.modifiedCount === 0 && driverResult.modifiedCount === 0) {
            return res.status(404).json({ error: "User or Driver not found" });
        }
        res.status(200).json({ message: "Blocked successfully" });
    } catch (err) {
        res.status(400).json({ error: "Invalid ID" });
    }
});

// Approve Driver (UPDATED: RESTRICTED TO ADMIN)
app.patch('/admin/approve/:driverId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const result = await db.collection('drivers').updateOne(
            { _id: new ObjectId(req.params.driverId) },
            { $set: { approved: true } }
        );
        if (result.modifiedCount === 0) return res.status(404).json({ error: "Driver not found" });
        res.status(200).json({ updated: result.modifiedCount });
    } catch (err) {
        res.status(400).json({ error: "Invalid driver ID" });
    }
});

// Analytics (UPDATED: RESTRICTED TO ADMIN)
app.get('/admin/analytics', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const usersCount = await db.collection('users').countDocuments();
        const driversCount = await db.collection('drivers').countDocuments();
        const ridesCount = await db.collection('rides').countDocuments();
        res.status(200).json({ users: usersCount, drivers: driversCount, rides: ridesCount });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});