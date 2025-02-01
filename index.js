const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const Joi = require("joi");

const isLocal = process.env.NODE_ENV !== "production";
const serviceAccount = isLocal
  ? require("./serviceAccountKey-dev.json")  // Local Firestore
  : require("./serviceAccountKey.json");     // Production Firestore

// Initialize Firebase Admin SDK
// const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const db = admin.firestore();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Validation Schemas
const orderSchema = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.string().required(),
  address: Joi.string().required(),
  orderNo: Joi.string().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  cod: Joi.boolean().required(),
  amount: Joi.number().required(),
});

const deliveryBoySchema = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.string().required(),
});

// Routes
app.get("/", (req, res) => {
  res.status(200).send(`API is running on ${isLocal ? "Local DB" : "Production DB"}`);
});

// Create Order
app.post("/api/createOrder", async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) return res.status(400).send({ status: "Failed", msg: error.message });

  try {
    const orderId = Date.now().toString();
    await db.collection("orders").doc(orderId).set({
      id: orderId,
      ...req.body,
    });
    res.status(200).send({ status: "Success", msg: "Order created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Get Single Order
app.get("/api/getOrder/:id", async (req, res) => {
  try {
    const orderDoc = db.collection("orders").doc(req.params.id);
    const orderDetail = await orderDoc.get();

    if (!orderDetail.exists) {
      return res.status(404).send({ status: "Failed", msg: "Order not found" });
    }

    res.status(200).send({ status: "Success", data: orderDetail.data() });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Get All Orders
app.get("/api/getAllOrders", async (req, res) => {
  try {
    const querySnapshot = await db.collection("orders")
      .select("name", "mobile", "address", "orderNo", "latitude", "longitude", "cod", "amount", "id")
      .get();
    const response = querySnapshot.docs.map((doc) => doc.data());
    res.status(200).send({ status: "Success", data: response });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Update Order
app.put("/api/updateOrder/:id", async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) return res.status(400).send({ status: "Failed", msg: error.message });

  try {
    const orderDoc = db.collection("orders").doc(req.params.id);
    await orderDoc.update(req.body);
    res.status(200).send({ status: "Success", msg: "Order updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Delete Order
app.delete("/api/deleteOrder/:id", async (req, res) => {
  try {
    const orderDoc = db.collection("orders").doc(req.params.id);
    await orderDoc.delete();
    res.status(200).send({ status: "Success", msg: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Create Delivery Boy
app.post("/api/createDeliveryBoy", async (req, res) => {
  const { error } = deliveryBoySchema.validate(req.body);
  if (error) {
    return res.status(400).send({ status: "Failed", msg: error.message });
  }

  try {
    const deliveryBoyId = req.body.mobile; // Mobile as document ID
    const deliveryBoyDoc = db.collection("deliveryBoys").doc(deliveryBoyId);
    const docSnapshot = await deliveryBoyDoc.get();

    // Check if the mobile number already exists
    if (docSnapshot.exists) {
      return res.status(400).send({
        status: "Failed",
        msg: "Delivery boy with this mobile number already exists",
      });
    }

    // If not, create a new document
    await deliveryBoyDoc.set({
      id: Date.now(),
      ...req.body,
    });

    res.status(200).send({ status: "Success", msg: "Delivery boy created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Listen on port 8080 (for AWS Elastic Beanstalk)
app.listen(process.env.PORT || 8080, () => {
  console.log("Server is running on port 8080");
});
