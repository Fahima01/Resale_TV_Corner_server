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

        // for collect booking data
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
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
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

        //buyer and seller
        app.get('/users/status', async (req, res) => {
            const status = req.params.status;
            const query = { status: status }
            const selectedCategory = await productCategoriesById.find(query).toArray();
            res.send(selectedCategory);
        })

        //make admin api
        app.put('/users/admin/:id', async (req, res) => {
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

    }
    finally {

    }
}
run().catch(console.log);



// app.get('/product-categories', (req, res) => {
//     res.send(categorie)
// })
// app.get('/products/:id', (req, res) => {
//     const id = req.params.id;
//     const selectedCategory = products.filter(p => p.category_id === id);
//     res.send(selectedCategory)

// })




app.get('/', async (req, res) => {
    res.send('Tv corner server is running');
});

app.listen(port, () => console.log(`Tv corner portal running on ${port}`));

