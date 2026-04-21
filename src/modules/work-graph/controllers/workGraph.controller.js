const workGraphService = require('../services/workGraph.service');

exports.getDependencyGraph = async (req, res, next) => {
    try {
        const graph = await workGraphService.getDependencyGraph(req.params.projectId);
        res.json({ success: true, data: graph });
    } catch (error) {
        next(error);
    }
};
