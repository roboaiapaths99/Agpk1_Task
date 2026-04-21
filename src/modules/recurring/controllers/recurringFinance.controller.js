const RecurringTemplate = require('../models/RecurringTemplate');
const { success } = require('../../../utils/response');

exports.createTemplate = async (req, res, next) => {
    try {
        const template = new RecurringTemplate({
            ...req.body,
            organizationId: req.user.organizationId,
            createdBy: req.user.id
        });
        await template.save();
        return success(res, template, 'Template created successfully', 201);
    } catch (err) {
        next(err);
    }
};

exports.getTemplates = async (req, res, next) => {
    try {
        const templates = await RecurringTemplate.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 });
        return success(res, templates);
    } catch (err) {
        next(err);
    }
};

exports.toggleStatus = async (req, res, next) => {
    try {
        const template = await RecurringTemplate.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        
        template.status = template.status === 'active' ? 'paused' : 'active';
        await template.save();
        
        return success(res, template, `Template ${template.status}`);
    } catch (err) {
        next(err);
    }
};
