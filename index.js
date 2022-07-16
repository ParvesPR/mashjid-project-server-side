const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');


// MIDDLEWARE
app.use(cors());
app.use(express.json());

// CONNECT TO MONGO DB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndcgl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log('MongoDB connected');

function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();

        const prayerCollection = client.db('mashjidDB').collection('prayerTime');
        const userCollection = client.db('mashjidDB').collection('users');
        const blogsCollection = client.db('mashjidDB').collection('blogs');
        const noticeCollection = client.db('mashjidDB').collection('notice');

        // GET ALL DATA
        app.get('/prayerTime', async (req, res) => {
            const query = {};
            const cursor = prayerCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // SAVE USER DATA
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const option = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, option);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' })
            res.send({ result, token });
        });

        //  GET ALL USERS DATA
        app.get('/users', verifyJwt, async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // CREATE A NEW POST
        app.post('/blogs', async (req, res) => {
            const newBlog = req.body;
            const result = await blogsCollection.insertOne(newBlog);
            res.send(result);
        });

        // POST A NEW NOTICE
        app.post('/notice', async (req, res) => {
            const newNotice = req.body;
            const result = await noticeCollection.insertOne(newNotice);
            res.send(result);
        });

        // GET ALL NOTICE
        app.get('/notice',verifyJwt, async (req, res) => {
            const query = {};
            const cursor = noticeCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
    }
    finally { }
};
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send("Central Mashjid Project is Running")
});

app.listen(port, () => {
    console.log('Listening to port', port)
})