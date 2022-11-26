const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oladmam.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const bookCategoriesCollection = client
      .db("ReShop")
      .collection("BookCategories");
    const booksCollection = client.db("ReShop").collection("Books");

    app.get("/BookCategories", async (req, res) => {
      const query = {};
      const options = await bookCategoriesCollection.find(query).toArray();
      res.send(options);
    });
    //category dhore api load korar api
    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { category_id: id };
      const books = await booksCollection.find(query).toArray();
      res.send(books);
    });
    //specific books er id
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: id };
      const books = await booksCollection.findOne(query);
      res.send(books);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("Reshop server is running");
});

app.listen(port, () => console.log(`Reshop server running on ${port}`));
