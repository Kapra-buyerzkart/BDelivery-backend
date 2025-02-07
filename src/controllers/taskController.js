const db = require("../config/firebase");
const { taskSchema } = require("../validation/schemas");

// Create Task
exports.createTask = async (req, res) => {
    const { error } = taskSchema.validate(req.body);
    if (error) return res.status(400).send({ status: "Failed", msg: error.message });

    try {
        const taskId = Date.now().toString();
        await db.collection("tasks").doc(taskId).set({ id: taskId, ...req.body });

        res.status(200).send({ status: "Success", msg: "Task created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
    }
};

// Get Single Task
exports.getTask = async (req, res) => {
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
};

// Get All Tasks with Pagination
exports.getAllTasks = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);

        if (parsedPage < 1) {
            return res.status(400).send({ status: "Failed", msg: "Page number must be 1 or higher." });
        }

        let query = db.collection("tasks").orderBy("taskNo").limit(parsedLimit);

        if (parsedPage > 1) {
            const prevQuerySnapshot = await db.collection("tasks").orderBy("taskNo").limit((parsedPage - 1) * parsedLimit).get();
            const prevDocs = prevQuerySnapshot.docs;

            if (prevDocs.length > 0) {
                query = query.startAfter(prevDocs[prevDocs.length - 1]);
            } else {
                return res.status(404).send({ status: "Failed", msg: "No records found for this page." });
            }
        }

        const querySnapshot = await query.get();
        const tasks = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        res.status(200).send({ status: "Success", data: tasks, page: parsedPage, limit: parsedLimit });
    } catch (err) {
        console.error(err);
        res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
    }
};

// Update Task
exports.updateTask = async (req, res) => {
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
};

// Delete Task
exports.deleteTask = async (req, res) => {
    try {
        await db.collection("tasks").doc(req.params.id).delete();
        res.status(200).send({ status: "Success", msg: "Task deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ status: "Failed", msg: "Internal Server Error" });
    }
};
