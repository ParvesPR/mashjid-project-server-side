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
console.log('MongoDB connected')



app.get('/', (req, res) => {
    res.send("Central Mashjid Project is Running")
});

app.listen(port, () => {
    console.log('Listening to port', port)
})