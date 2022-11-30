const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const port = process.env.PORT || 5000;

const app = express();
// middleware
app.use(cors());
app.use(express.json());



// const categorie = require('./data/productCategories.json');
// const products = require('./data/allProducts.json')

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.es5pnpl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJwt(req, res, next) {
    //console.log('token', req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();

    })
}
async function run() {
    try {
        const productCategories = client.db('TvCorner').collection('product-categories');
        const productCategoriesById = client.db('TvCorner').collection('products');
        const bookingCollection = client.db('TvCorner').collection('bookings');
        const userCollection = client.db('TvCorner').collection('users');
        const addProductsCollection = client.db('TvCorner').collection('productsadd');



        app.get('/product-categories', async (req, res) => {
            const query = {};
            const options = await productCategories.find(query).toArray();
            res.send(options)
        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id }
            const selectedCategory = await productCategoriesById.find(query).toArray();
            res.send(selectedCategory);
        })

        //for collect booking data
        app.post('/bookings', async (req, res) => {
            const booking = req.body
            console.log(booking)
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        app.get('/bookings', verifyJwt, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email }
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })

        //post users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(user);

        })

        //get jwt user
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const qurey = { email: email }
            const user = await userCollection.findOne(qurey);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            console.log(user)
            res.status(403).send({ accessToken: '' })
        })

        //get allusers
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        })



        //get admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })

        })

        //get user-only
        app.get('/users/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isUser: user?.status === 'User' })

        })

        //make admin api
        app.put('/users/admin/:id', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await userCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ messege: 'Forbiden Access' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        //upload products
        app.get('/productsadd', verifyJwt, async (req, res) => {
            const query = {};
            const addProducts = await addProductsCollection.find(query).toArray();
            res.send(addProducts);
        })

        //add data to mongodb
        app.post('/productsadd', verifyJwt, async (req, res) => {
            const addProducts = req.body;
            const result = await addProductsCollection.insertOne(addProducts);
            res.send(result);
        });

        app.delete('/productsadd/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await addProductsCollection.deleteOne(filter);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(console.log);


app.get('/', async (req, res) => {
    res.send('Tv corner server is running');
});

app.listen(port, () => console.log(`Tv corner portal running on ${port}`));

