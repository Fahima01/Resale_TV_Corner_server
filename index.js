const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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


async function run() {
    try {
        const productCategories = client.db('TvCorner').collection('product-categories');
        const productCategoriesById = client.db('TvCorner').collection('products');
        const bookingCollection = client.db('TvCorner').collection('bookings');

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

