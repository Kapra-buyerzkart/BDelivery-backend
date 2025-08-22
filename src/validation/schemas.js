const Joi = require("joi");

const taskSchema = Joi.object({
    customerName: Joi.string().required(),
    mobile: Joi.string().required(),
    taskNo: Joi.string().required(),
    pickupAddress: Joi.object({
        addressLineOne: Joi.string().required(),
        addressLineTwo: Joi.string().required(),
        addressLineThree: Joi.string().required(),
        pincode: Joi.number().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }).required(),
    // deliveryAddress: Joi.string().required(),
    deliveryAddress: Joi.object({
        addressLineOne: Joi.string().required(),
        addressLineTwo: Joi.string().required(),
        addressLineThree: Joi.string().required(),
        pincode: Joi.number().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }).required(),
    type: Joi.string().valid("cod", "online").required(),
    amount: Joi.when("type", {
        is: "cod",
        then: Joi.number().required(),
        otherwise: Joi.forbidden(),
    }),
    microStoreName: Joi.string().required(),
    storeId: Joi.string().required(),
    pickupCompleted: Joi.boolean().required(),
    deliveryCompleted: Joi.boolean().required(),
    taskStatus: Joi.string().valid("pending").default("pending"),
    selectedByDeliveryAgent: Joi.boolean().valid(false).default(false)
});

const deliveryAgentSchema = Joi.object({
    name: Joi.string().required(),
    mobile: Joi.string().required(),
    password: Joi.string().required(),
    email: Joi.string().email().required(),
    storeId: Joi.string().required(),
});

module.exports = { taskSchema, deliveryAgentSchema };
