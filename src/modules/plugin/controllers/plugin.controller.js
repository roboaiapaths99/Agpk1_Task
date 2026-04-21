const { pluginService } = require('../models/Plugin');

exports.getPlugins = async (req, res, next) => {
    try {
        const plugins = await pluginService.getPlugins(req.user.organizationId);
        res.json({ success: true, data: plugins });
    } catch (error) {
        next(error);
    }
};

exports.registerPlugin = async (req, res, next) => {
    try {
        const plugin = await pluginService.register(req.body, req.user.organizationId);
        res.status(201).json({ success: true, data: plugin });
    } catch (error) {
        next(error);
    }
};
