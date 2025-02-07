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
const taskSchema = Joi.object({
  customerName: Joi.string().required(),
  mobile: Joi.string().required(),
  taskNo: Joi.string().required(),
  pickupLocation: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  deliveryAddress: Joi.string().required(),
  deliveryLocation: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }),
  type: Joi.string().valid("cod", "online").required(),
  amount: Joi.when("type", {
    is: "cod",
    then: Joi.number().required(),
    otherwise: Joi.forbidden(), // Prevents amount from being present if type is "online"
  }),
  microStoreName: Joi.string().required(),
  storeId: Joi.string().required()
});

const deliveryAgentSchema = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().email().required(),
  storeId: Joi.string().required()
});

// Routes
app.get("/", (req, res) => {
  res.status(200).send(`API is running on ${isLocal ? "Local DB" : "Production DB"}`);
});

// Create Task
app.post("/api/createTask", async (req, res) => {
  const { error } = taskSchema.validate(req.body);
  if (error) return res.status(400).send({ status: "Failed", msg: error.message });

  try {
    const taskId = Date.now().toString();
    await db.collection("tasks").doc(taskId).set({
      id: taskId,
      ...req.body,
    });
    res.status(200).send({ status: "Success", msg: "task created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Get Single Task
app.get("/api/getTask/:id", async (req, res) => {
  try {
    const taskDoc = db.collection("tasks").doc(req.params.id);
    const taskDetail = await taskDoc.get();

    if (!taskDetail.exists) {
      return res.status(404).send({ status: "Failed", msg: "Task not found" });
    }

    res.status(200).send({ status: "Success", data: taskDetail.data() });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Get All Orders
// app.get("/api/getAllOrders", async (req, res) => {
//   try {
//     const querySnapshot = await db.collection("orders")
//       .select("name", "mobile", "address", "orderNo", "latitude", "longitude", "cod", "amount", "id")
//       .get();
//     const response = querySnapshot.docs.map((doc) => doc.data());
//     res.status(200).send({ status: "Success", data: response });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
//   }
// });

app.get("/api/getAllTasks", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default page = 1, limit = 10
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    if (parsedPage < 1) {
      return res.status(400).send({ status: "Failed", msg: "Page number must be 1 or higher." });
    }

    let query = db.collection("tasks")
      .orderBy("taskNo") // Ensure consistent ordering
      .select("customerName", "mobile", "deliveryAddress", "taskNo", "type", "pickupLocation", "deliveryLocation", "amount", "microStoreName", "id", "storeId")
      .limit(parsedLimit);

    // Fetching the last document of the previous page (for cursor-based pagination)
    if (parsedPage > 1) {
      const prevPageLastDocIndex = (parsedPage - 1) * parsedLimit - 1;

      // Fetch only the required documents to find the last doc of previous page
      const prevQuerySnapshot = await db.collection("tasks")
        .orderBy("taskNo")
        .limit(prevPageLastDocIndex + 1) // Fetch docs up to this index
        .get();

      const prevDocs = prevQuerySnapshot.docs;

      if (prevDocs.length > prevPageLastDocIndex) {
        const lastDoc = prevDocs[prevPageLastDocIndex]; // Get last document of previous page
        query = query.startAfter(lastDoc);
      } else {
        return res.status(404).send({ status: "Failed", msg: "No records found for this page." });
      }
    }

    const querySnapshot = await query.get();
    const tasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('taskssss', tasks)

    res.status(200).send({
      status: "Success",
      data: tasks,
      page: parsedPage,
      limit: parsedLimit,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Update Task
app.put("/api/updateTask/:id", async (req, res) => {
  const { error } = taskSchema.validate(req.body);
  if (error) return res.status(400).send({ status: "Failed", msg: error.message });

  try {
    const taskDoc = db.collection("tasks").doc(req.params.id);
    await taskDoc.update(req.body);
    res.status(200).send({ status: "Success", msg: "Task updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Delete Task
app.delete("/api/deleteTask/:id", async (req, res) => {
  try {
    const taskDoc = db.collection("tasks").doc(req.params.id);
    await taskDoc.delete();
    res.status(200).send({ status: "Success", msg: "Task deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Create Delivery Agent
app.post("/api/createDeliveryAgent", async (req, res) => {
  const { error } = deliveryAgentSchema.validate(req.body);
  if (error) {
    return res.status(400).send({ status: "Failed", msg: error.message });
  }

  try {
    const deliveryAgentId = req.body.mobile; // Mobile as document ID
    const deliveryAgentDoc = db.collection("deliveryAgents").doc(deliveryAgentId);
    const docSnapshot = await deliveryAgentDoc.get();

    // Check if the mobile number already exists
    if (docSnapshot.exists) {
      return res.status(400).send({
        status: "Failed",
        msg: "Delivery agent with this mobile number already exists",
      });
    }

    // If not, create a new document
    await deliveryAgentDoc.set({
      id: Date.now(),
      ...req.body,
    });

    res.status(200).send({ status: "Success", msg: "Delivery agent created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
  }
});

// Listen on port 8080 (for AWS Elastic Beanstalk)
app.listen(process.env.PORT || 8080, () => {
  console.log("Server is running on port 8080");
});
