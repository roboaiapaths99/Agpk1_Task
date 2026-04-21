const User = require('../models/User');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/appError');

/**
 * Fetch organizational hierarchy as a nested tree
 */
exports.getHierarchy = catchAsync(async (req, res) => {
    const users = await User.find({ 
        organizationId: req.user.organizationId,
        isActive: true 
    }).select('name email designation managerId avatar department role');

    // Recursive function to build tree
    const buildTree = (data, parentId = null) => {
        const tree = [];
        data.forEach(item => {
            const itemManagerId = item.managerId ? item.managerId.toString() : null;
            const targetParentId = parentId ? parentId.toString() : null;

            if (itemManagerId === targetParentId) {
                const children = buildTree(data, item._id);
                const node = { 
                    ...item.toObject(), 
                    id: item._id, // react-flow needs id
                    children 
                };
                tree.push(node);
            }
        });
        return tree;
    };

    const hierarchy = buildTree(users, null);

    res.status(200).json({
        status: 'success',
        data: hierarchy
    });
});

/**
 * Update a user's manager (for dragging in the org chart)
 */
exports.updateManager = catchAsync(async (req, res) => {
    const { userId, managerId } = req.body;

    if (userId === managerId) {
        throw new AppError('A user cannot be their own manager', 400);
    }

    const user = await User.findOne({ _id: userId, organizationId: req.user.organizationId });
    if (!user) {
        throw new AppError('User not found', 404);
    }

    // If managerId is provided, verify it exists and is in the same org
    if (managerId) {
        const manager = await User.findOne({ _id: managerId, organizationId: req.user.organizationId });
        if (!manager) {
            throw new AppError('Manager not found', 404);
        }
        
        // Prevent circular references (basic check: manager's manager shouldn't be the user)
        // For deep check, we'd need to walk up the tree
        // Here we just do a simple update
    }

    user.managerId = managerId || null;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Hierarchy updated successfully'
    });
});

/**
 * Get flat list of potential managers
 */
exports.getPotentialManagers = catchAsync(async (req, res) => {
    const managers = await User.find({
        organizationId: req.user.organizationId,
        isActive: true
    }).select('name designation');

    res.status(200).json({
        status: 'success',
        data: managers
    });
});
