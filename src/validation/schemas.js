const Joi = require("joi");

const taskSchema = Joi.object({
    customerName: Joi.string().required(),
    mobile: Joi.string().required(),
    taskNo: Joi.string().required(),
    pickupLocation: Joi.object({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }).required(),
    deliveryAddress: Joi.string().required(),
    deliveryLocation: Joi.object({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }),
    type: Joi.string().valid("cod", "online").required(),
    amount: Joi.when("type", {
        is: "cod",
        then: Joi.number().required(),
        otherwise: Joi.forbidden(),
    }),
    microStoreName: Joi.string().required(),
    storeId: Joi.string().required(),
});

const deliveryAgentSchema = Joi.object({
    name: Joi.string().required(),
    mobile: Joi.string().required(),
    password: Joi.string().required(),
    email: Joi.string().email().required(),
    storeId: Joi.string().required(),
});

module.exports = { taskSchema, deliveryAgentSchema };
