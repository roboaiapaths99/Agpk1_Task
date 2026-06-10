const mongoose = require('mongoose');
const Task = require('../../src/modules/work-item/models/Task');
const { Project } = require('../../src/modules/project/models/Project');
const taskService = require('../../src/modules/work-item/services/task.service');
const { ForbiddenError } = require('../../src/core/errors');

const makeChainableMock = (finalValue) => {
    const mock = {};
    const chainMethod = () => mock;
    mock.populate = jest.fn(chainMethod);
    mock.sort = jest.fn(chainMethod);
    mock.skip = jest.fn(chainMethod);
    mock.limit = jest.fn(chainMethod);
    mock.select = jest.fn(chainMethod);
    mock.lean = jest.fn(() => Promise.resolve(finalValue));
    // Support directly awaiting the promise
    mock.then = jest.fn((onFulfilled) => Promise.resolve(finalValue).then(onFulfilled));
    return mock;
};

describe('TaskService Access & Visibility Tests', () => {
    let mockUser1Id, mockUser2Id, mockOrgId, mockProjId;
    let findSpy, findOneSpy, findOneAndUpdateSpy, projectFindSpy;

    beforeAll(() => {
        findSpy = jest.spyOn(Task, 'find');
        findOneSpy = jest.spyOn(Task, 'findOne');
        findOneAndUpdateSpy = jest.spyOn(Task, 'findOneAndUpdate');
        projectFindSpy = jest.spyOn(Project, 'find');
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockUser1Id = new mongoose.Types.ObjectId();
        mockUser2Id = new mongoose.Types.ObjectId();
        mockOrgId = new mongoose.Types.ObjectId();
        mockProjId = new mongoose.Types.ObjectId();
    });

    describe('getTasks', () => {
        it('should retrieve project tasks, standalone tasks, and user-associated tasks for non-admins', async () => {
            const mockProjects = [{ _id: mockProjId }];
            projectFindSpy.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockProjects)
            });

            const mockQuery = makeChainableMock([]);
            findSpy.mockReturnValue(mockQuery);
            jest.spyOn(Task, 'countDocuments').mockResolvedValue(0);

            await taskService.getTasks(mockOrgId, {}, mockUser1Id, 'user');

            expect(projectFindSpy).toHaveBeenCalledWith({
                organizationId: mockOrgId,
                $or: [
                    { owner: mockUser1Id },
                    { members: mockUser1Id }
                ]
            });

            expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
                organizationId: mockOrgId,
                $or: [
                    { project: { $in: [mockProjId] } },
                    { project: null },
                    { assignee: mockUser1Id },
                    { createdBy: mockUser1Id },
                    { watchers: mockUser1Id }
                ]
            }));
        });

        it('should restrict to specified project if queried and user has access', async () => {
            const mockProjects = [{ _id: mockProjId }];
            projectFindSpy.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockProjects)
            });

            const mockQuery = makeChainableMock([]);
            findSpy.mockReturnValue(mockQuery);
            jest.spyOn(Task, 'countDocuments').mockResolvedValue(0);

            await taskService.getTasks(mockOrgId, { project: mockProjId.toString() }, mockUser1Id, 'user');

            expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
                organizationId: mockOrgId,
                project: mockProjId.toString()
            }));
        });

        it('should return empty results if queried project is not accessible to user', async () => {
            const mockProjects = [{ _id: mockProjId }];
            projectFindSpy.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockProjects)
            });

            const mockQuery = makeChainableMock([]);
            findSpy.mockReturnValue(mockQuery);
            jest.spyOn(Task, 'countDocuments').mockResolvedValue(0);

            const otherProjId = new mongoose.Types.ObjectId();
            await taskService.getTasks(mockOrgId, { project: otherProjId.toString() }, mockUser1Id, 'user');

            expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
                organizationId: mockOrgId,
                project: { $in: [] }
            }));
        });
    });

    describe('getTaskById', () => {
        it('should allow project members access to the task', async () => {
            const mockTask = {
                _id: 'task1',
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: [mockUser1Id]
                }
            };

            const mockQuery = makeChainableMock(mockTask);
            findOneSpy.mockReturnValue(mockQuery);

            const result = await taskService.getTaskById('task1', mockOrgId, mockUser1Id, 'user');
            expect(result).toEqual(mockTask);
        });

        it('should allow assignees access to the task even if not a project member', async () => {
            const mockTask = {
                _id: 'task1',
                assignee: mockUser1Id,
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: []
                }
            };

            const mockQuery = makeChainableMock(mockTask);
            findOneSpy.mockReturnValue(mockQuery);

            const result = await taskService.getTaskById('task1', mockOrgId, mockUser1Id, 'user');
            expect(result).toEqual(mockTask);
        });

        it('should allow creators access to the task even if not a project member', async () => {
            const mockTask = {
                _id: 'task1',
                createdBy: mockUser1Id,
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: []
                }
            };

            const mockQuery = makeChainableMock(mockTask);
            findOneSpy.mockReturnValue(mockQuery);

            const result = await taskService.getTaskById('task1', mockOrgId, mockUser1Id, 'user');
            expect(result).toEqual(mockTask);
        });

        it('should allow watchers access to the task even if not a project member', async () => {
            const mockTask = {
                _id: 'task1',
                watchers: [mockUser1Id],
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: []
                }
            };

            const mockQuery = makeChainableMock(mockTask);
            findOneSpy.mockReturnValue(mockQuery);

            const result = await taskService.getTaskById('task1', mockOrgId, mockUser1Id, 'user');
            expect(result).toEqual(mockTask);
        });

        it('should deny access if user is not a project member, assignee, creator, or watcher', async () => {
            const mockTask = {
                _id: 'task1',
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: [new mongoose.Types.ObjectId()] // not mockUser1Id
                }
            };

            const mockQuery = makeChainableMock(mockTask);
            findOneSpy.mockReturnValue(mockQuery);

            await expect(
                taskService.getTaskById('task1', mockOrgId, mockUser1Id, 'user')
            ).rejects.toThrow(ForbiddenError);
        });

        it('should allow admin access even if not a project member', async () => {
            const mockTask = {
                _id: 'task1',
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: [new mongoose.Types.ObjectId()]
                }
            };

            const mockQuery = makeChainableMock(mockTask);
            findOneSpy.mockReturnValue(mockQuery);

            const result = await taskService.getTaskById('task1', mockOrgId, mockUser1Id, 'admin');
            expect(result).toEqual(mockTask);
        });

        it('should allow anyone access if it is a standalone task (no project)', async () => {
            const mockTask = {
                _id: 'task1',
                project: null
            };

            const mockQuery = makeChainableMock(mockTask);
            findOneSpy.mockReturnValue(mockQuery);

            const result = await taskService.getTaskById('task1', mockOrgId, mockUser1Id, 'user');
            expect(result).toEqual(mockTask);
        });
    });

    describe('getSubTasks', () => {
        it('should validate parent task access first', async () => {
            const mockParentTask = {
                _id: 'parent1',
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: [new mongoose.Types.ObjectId()] // mockUser1Id is not a member
                }
            };

            const mockQuery = makeChainableMock(mockParentTask);
            findOneSpy.mockReturnValue(mockQuery);

            await expect(
                taskService.getSubTasks('parent1', mockOrgId, mockUser1Id, 'user')
            ).rejects.toThrow(ForbiddenError);
        });

        it('should retrieve subtasks if user has access to parent task', async () => {
            const mockParentTask = {
                _id: 'parent1',
                project: null
            };

            findOneSpy.mockReturnValue(makeChainableMock(mockParentTask));
            findSpy.mockReturnValue(makeChainableMock([{ _id: 'child1' }]));

            const subTasks = await taskService.getSubTasks('parent1', mockOrgId, mockUser1Id, 'user');
            expect(subTasks).toEqual([{ _id: 'child1' }]);
            expect(findSpy).toHaveBeenCalledWith({ parent: 'parent1', organizationId: mockOrgId });
        });
    });

    describe('assignTask', () => {
        it('should check task access and restrict assign for unauthorized users', async () => {
            const mockTask = {
                _id: 'task1',
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: []
                }
            };

            findOneSpy.mockReturnValue(makeChainableMock(mockTask));

            await expect(
                taskService.assignTask('task1', mockOrgId, mockUser1Id, mockUser1Id, 'user')
            ).rejects.toThrow(ForbiddenError);
        });
    });

    describe('changeStatus', () => {
        it('should check task access and restrict transition for unauthorized users', async () => {
            const mockTask = {
                _id: 'task1',
                project: {
                    _id: mockProjId,
                    owner: mockUser2Id,
                    members: []
                }
            };

            findOneSpy.mockReturnValue(makeChainableMock(mockTask));

            await expect(
                taskService.changeStatus('task1', mockOrgId, 'in_progress', mockUser1Id, 'user')
            ).rejects.toThrow(ForbiddenError);
        });
    });
});
