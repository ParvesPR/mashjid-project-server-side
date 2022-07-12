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

async function run() {
    try {
        await client.connect();

        const prayerCollection = client.db('mashjidDB').collection('prayerTime');
        const blogsCollection = client.db('mashjidDB').collection('blogs');
        const noticeCollection = client.db('mashjidDB').collection('notice');

        // GET ALL DATA
        app.get('/prayerTime', async (req, res) => {
            const query = {};
            const cursor = prayerCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

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