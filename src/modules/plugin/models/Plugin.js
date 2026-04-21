const mongoose = require('mongoose');

const pluginSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    webhookUrl: { type: String },
    events: [{ type: String }], // Events this plugin subscribes to
    permissions: [String],
    isActive: { type: Boolean, default: false },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

pluginSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const Plugin = mongoose.models.Plugin || mongoose.model('Plugin', pluginSchema);

class PluginService {
    async register(data, organizationId) { return Plugin.create({ ...data, organizationId }); }
    async getPlugins(organizationId) { return Plugin.find({ organizationId, isActive: true }); }
}

module.exports = { Plugin, pluginService: new PluginService() };
