const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oladmam.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  // console.log("token inside VerifyJWT", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    //categories
    const bookCategoriesCollection = client
      .db("ReShop")
      .collection("BookCategories");
    //products
    const booksCollection = client.db("ReShop").collection("Books");
    //bookings
    const bookingsCollection = client.db("ReShop").collection("bookings");
    //users
    const usersCollection = client.db("ReShop").collection("users");
    //addproduct
    const addProductsCollection = client
      .db("ReShop")
      .collection("addedProducts");

    //NOTE: make sure you use verifySeller after verifyJWT
    const verifySeller = async (req, res, next) => {
      console.log("Inside verifyAdmin", req.decoded.email);
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/BookCategories", async (req, res) => {
      const query = {};
      const options = await bookCategoriesCollection.find(query).toArray();
      res.send(options);
    });

    //category dhore api load korar api
    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { category_id: id };
      const books = await booksCollection.find(query).toArray();
      res.send(books);
    });

    //specific books er id
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const books = await booksCollection.findOne(query);
      res.send(books);
    });

    //booking get
    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    //booking data post
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      // console.log(booking);
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    //api for jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1hr",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
      // console.log(user);
    });

    //seller
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      // console.log(user);
      res.send({ user, isSeller: user?.role === "seller" });
    });

    app.get("/userType", async (req, res) => {
      const query = { role: req.query.role };
      const cursor = usersCollection.find(query);
      const selectedBooks = await cursor.toArray();
      res.send(selectedBooks);
    });

    //admin
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    //all users
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    //user database e pathabo
    app.post("/users", verifyJWT, async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/addedProducts", verifyJWT, verifySeller, async (req, res) => {
      const query = {};
      const products = await addProductsCollection.find(query).toArray();
      res.send(products);
    });

    app.post("/addedProducts", verifyJWT, async (req, res) => {
      const addedProduct = req.body;
      const result = await addProductsCollection.insertOne(addedProduct);
      res.send(result);
    });

    //delete user
    app.delete("/users/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
      // console.log(result);
    });

    //delete product
    app.delete("/addedProducts/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await addProductsCollection.deleteOne(filter);
      res.send(result);
    });

    app.get("/addedProducts/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const product = await addProductsCollection.findOne(query);
      console.log(product);
      res.send(product);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("ReShop server is running");
});

app.listen(port, () => console.log(`ReShop server running on ${port}`));
