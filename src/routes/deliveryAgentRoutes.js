const express = require("express");
const router = express.Router();
const deliveryAgentController = require("../controllers/deliveryAgentController");

router.post("/createDeliveryAgent", deliveryAgentController.createDeliveryAgent);
router.get("/getAllDeliveryAgents", deliveryAgentController.getAllDeliveryAgents);

module.exports = router;
