/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");

const admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const express = require("express");

const cors = require("cors");

const app = express();

app.use(cors({ origin: true }));

const db = admin.firestore();

app.get('/', (req, res) => {
    return res.status(200).send("Hiiiiii");
});

app.post('/api/create', (req, res) => {
    (async () => {
        try {
            await db.collection("orders").doc(`/${Date.now()}/`).create({
                id: Date.now(),
                name: req.body.name,
                mobile: req.body.mobile,
                address: req.body.address
            });
            return res.status(200).send({ status: "Success", msg: "Data saved" });
        } catch (error) {
            console.log(error);
            return res.status(500).send({ status: "Failed", msg: error });
        }
    })();
});

app.get('/api/get/:id', (req, res) => {
    (async () => {
        try {
            const reqDoc = db.collection('orders').doc(req.params.id)
            let orderDetail = await reqDoc.get();
            let response = orderDetail.data();
            return res.status(200).send({ status: "Success", data: response })
        } catch (error) {
            console.log(error);
            return res.status(500).send({ status: "Failed", msg: error });
        }
    })();
})

app.get('/api/getAll', (req, res) => {
    (async () => {
        try {
            const query = db.collection('orders');
            let response = [];

            await query.get().then((data) => {
                let docs = data.docs;
                docs.map((doc) => {
                    const selectedItem = {
                        name: doc.data().name,
                        mobile: doc.data().mobile,
                        address: doc.data().address
                    };
                    response.push(selectedItem);
                });
                return response
            });
            return res.status(200).send({ status: "Success", data: response })
        } catch (error) {
            console.log(error);
            return res.status(500).send({ status: "Failed", msg: error });
        }
    })();
})

exports.app = functions.https.onRequest(app);
