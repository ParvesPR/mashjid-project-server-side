const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


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
        const prayerTimeCollection = client.db('mashjidDB').collection('setTime');
        const userCollection = client.db('mashjidDB').collection('users');
        const blogsCollection = client.db('mashjidDB').collection('blogs');
        const noticeCollection = client.db('mashjidDB').collection('notice');
        const committeeCollection = client.db('mashjidDB').collection('committee');

        // PROTECT ADMIN URL
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' })
            }
        };

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
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ result, token });
        });

        //  GET ALL USERS DATA (DASHBOARD)
        app.get('/user', verifyJwt, verifyAdmin, async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        //  GET ALL USERS DATA (NAVBAR)
        app.get('/users', verifyJwt, async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // MAKE USER AN ADMIN
        app.put('/user/admin/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' }
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // FIND ADMIN USER
        app.get('/admin/:email', verifyJwt, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        });

        // POST A NEW BLOG
        app.post('/blogs', verifyJwt, verifyAdmin, async (req, res) => {
            const newBlog = req.body;
            const result = await blogsCollection.insertOne(newBlog);
            res.send(result);
        });

        // LOAD ALL BLOGS
        app.get('/blogs', async (req, res) => {
            const query = {};
            const cursor = blogsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // DELETE A BLOG
        app.delete('/blogs/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await blogsCollection.deleteOne(query);
            res.send(result);
        })

        // ADD A NEW NOTICE
        app.post('/addNotice', verifyJwt, verifyAdmin, async (req, res) => {
            const notice = req.body;
            const result = await noticeCollection.insertOne(notice);
            res.send(result)
        });

        // DELETE A NOTICE
        app.delete('/notice/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await noticeCollection.deleteOne(query);
            res.send(result);
        })

        // GET ALL NOTICE
        app.get('/notice', verifyJwt, async (req, res) => {
            const query = {};
            const cursor = noticeCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });

        // ADD A COMMITTEE
        app.post('/committee', verifyJwt, verifyAdmin, async (req, res) => {
            const committee = req.body;
            const result = await committeeCollection.insertOne(committee);
            res.send(result)
        });

        // GET ALL COMMITTEE PROFILE
        app.get('/committee', async (req, res) => {
            const query = {};
            const cursor = committeeCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // DELETE A COMMITTEE PROFILE
        app.delete('/committee/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await committeeCollection.deleteOne(query);
            res.send(result);
        });

        // GET ALL PRAYERS TIMES
        app.get('/prayerTime', async (req, res) => {
            const query = {};
            const cursor = prayerTimeCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // PUT PRAYER NEW TIME TABLE
        app.put('/prayerTime/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const currentTime = req.body;
            console.log(currentTime);
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    currentTime
                }
            };
            const newTime = await prayerCollection.updateOne(filter, updateDoc)
            res.send(newTime);
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