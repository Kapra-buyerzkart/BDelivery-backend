const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const express = require("express");
const cors = require("cors");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const db = admin.firestore();

app.use(cors({ origin: true }));

app.get("/", (req, res) => {
  res.status(200).send("Hiiiiii");
});

app.post("/api/create", async (req, res) => {
  try {
    await db.collection("orders").doc(`/${Date.now()}/`).create({
      id: Date.now(),
      name: req.body.name,
      mobile: req.body.mobile,
      address: req.body.address,
      orderNo: req.body.orderNo,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      cod: req.body.cod,
      amount: req.body.amount
    });
    res.status(200).send({ status: "Success", msg: "Data saved" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Failed", msg: error.message });
  }
});

app.get("/api/get/:id", async (req, res) => {
  try {
    const orderDoc = db.collection("orders").doc(req.params.id);
    const orderDetail = await orderDoc.get();

    if (!orderDetail.exists) {
      return res.status(404).send({ status: "Failed", msg: "Order not found" });
    }

    res.status(200).send({ status: "Success", data: orderDetail.data() });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Failed", msg: error.message });
  }
});

app.get("/api/getAll", async (req, res) => {
  try {
    const querySnapshot = await db.collection("orders").get();
    const response = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.name,
        mobile: data.mobile,
        address: data.address,
        orderNo: data.orderNo,
        latitude: data.latitude,
        longitude: data.longitude,
        cod: data.cod,
        amount: data.amount
      };
    });

    res.status(200).send({ status: "Success", data: response });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Failed", msg: error.message });
  }
});

app.put("/api/update/:id", async (req, res) => {
  try {
    const orderDoc = db.collection("orders").doc(req.params.id);
    await orderDoc.update({
      name: req.body.name,
      mobile: req.body.mobile,
      address: req.body.address,
      orderNo: req.body.orderNo,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      cod: req.body.cod,
      amount: req.body.amount
    });

    res.status(200).send({ status: "Success", msg: "Data updated" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Failed", msg: error.message });
  }
});

app.delete("/api/delete/:id", async (req, res) => {
  try {
    const orderDoc = db.collection("orders").doc(req.params.id);
    await orderDoc.delete();

    res.status(200).send({ status: "Success", msg: "Data removed" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Failed", msg: error.message });
  }
});

exports.app = functions.https.onRequest(app);
