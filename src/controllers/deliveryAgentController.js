const db = require("../config/firebase");
const { deliveryAgentSchema } = require("../validation/schemas");

exports.createDeliveryAgent = async (req, res) => {
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
};
