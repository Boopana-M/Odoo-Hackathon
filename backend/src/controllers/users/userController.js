import { User, Employee, Department, ROLES } from '../../models/index.js';

// Roles that an Admin is allowed to promote an Employee TO.
// Admin cannot be self-assigned via this endpoint.
const PROMOTABLE_ROLES = [ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD];

// ── List all users (with linked employee profiles) ───────────────────────────
/**
 * GET /api/users
 * Admin only. Returns all users with optional filtering.
 */
export const listUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;

    const userFilter = {};
    if (role) userFilter.role = role;
    if (isActive !== undefined) userFilter.isActive = isActive === 'true';

    const users = await User.find(userFilter).sort({ createdAt: -1 });

    // Attach employee profile to each user
    const userIds = users.map((u) => u._id);
    const employees = await Employee.find({ userId: { $in: userIds } });
    const employeeMap = {};
    for (const emp of employees) {
      employeeMap[emp.userId.toString()] = emp;
    }

    let result = users.map((u) => ({
      user: u.toJSON(),
      employee: employeeMap[u._id.toString()] || null
    }));

    // Optional search by employee name
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        ({ user, employee }) =>
          user.email.includes(term) ||
          (employee && employee.name.toLowerCase().includes(term))
      );
    }

    return res.status(200).json({ users: result, total: result.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list users.' } });
  }
};

// ── Get a single user ─────────────────────────────────────────────────────────
/**
 * GET /api/users/:id
 * Admin only.
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found.' } });
    }

    const employee = await Employee.findOne({ userId: user._id }).populate('departmentId');

    return res.status(200).json({ user, employee });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid user ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to retrieve user.' } });
  }
};

// ── Promote or demote a user's role ──────────────────────────────────────────
/**
 * PATCH /api/users/:id/role
 * Admin only.
 * Body: { role: 'Asset Manager' | 'Department Head' | 'Employee' }
 *
 * Security rules:
 *  - Admin cannot change their own role.
 *  - Admin role cannot be assigned via this endpoint.
 *  - Only PROMOTABLE_ROLES and ROLES.EMPLOYEE (demotion) are allowed targets.
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: { message: 'Role is required.' } });
    }

    // Block Admin role assignment through this endpoint
    if (role === ROLES.ADMIN) {
      return res.status(403).json({
        error: { message: 'Admin role cannot be assigned via this endpoint.' }
      });
    }

    // Allowed target roles: promotable roles + Employee (for demotion)
    const allowedTargets = [...PROMOTABLE_ROLES, ROLES.EMPLOYEE];
    if (!allowedTargets.includes(role)) {
      return res
        .status(400)
        .json({ error: { message: `Role must be one of: ${allowedTargets.join(', ')}.` } });
    }

    // Admin cannot change their own role
    if (req.user._id.toString() === id) {
      return res
        .status(403)
        .json({ error: { message: 'Admins cannot change their own role.' } });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ error: { message: 'User not found.' } });
    }

    // Prevent modifying another Admin
    if (target.role === ROLES.ADMIN) {
      return res
        .status(403)
        .json({ error: { message: 'Cannot modify the role of another Admin.' } });
    }

    const previousRole = target.role;
    target.role = role;
    await target.save();

    return res.status(200).json({
      message: `User role updated from "${previousRole}" to "${role}".`,
      user: target
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid user ID format.' } });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    return res.status(500).json({ error: { message: 'Failed to update user role.' } });
  }
};

// ── Activate or deactivate a user account ────────────────────────────────────
/**
 * PATCH /api/users/:id/status
 * Admin only.
 * Body: { isActive: true | false }
 *
 * Security rules:
 *  - Admin cannot deactivate their own account.
 *  - Admin cannot deactivate another Admin.
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined || isActive === null) {
      return res.status(400).json({ error: { message: 'isActive (boolean) is required.' } });
    }
    if (typeof isActive !== 'boolean') {
      return res
        .status(400)
        .json({ error: { message: 'isActive must be a boolean (true or false).' } });
    }

    // Admin cannot deactivate themselves
    if (req.user._id.toString() === id) {
      return res
        .status(403)
        .json({ error: { message: 'Admins cannot deactivate their own account.' } });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ error: { message: 'User not found.' } });
    }

    // Admin cannot deactivate another Admin
    if (target.role === ROLES.ADMIN) {
      return res
        .status(403)
        .json({ error: { message: 'Cannot change the status of another Admin account.' } });
    }

    target.isActive = isActive;
    await target.save();

    const action = isActive ? 'activated' : 'deactivated';
    return res.status(200).json({
      message: `User account ${action} successfully.`,
      user: target
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid user ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update user status.' } });
  }
};

// ── Change user department ───────────────────────────────────────────────────
/**
 * PATCH /api/users/:id/department
 * Admin only.
 * Body: { departmentId: string | null }
 */
export const updateUserDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found.' } });
    }

    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee profile not found for this user.' } });
    }

    // If departmentId is provided, verify it is a valid active Department
    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ error: { message: 'Department not found.' } });
      }
    }

    employee.departmentId = departmentId || null;
    await employee.save();

    return res.status(200).json({
      message: 'Employee department updated successfully.',
      employee
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update user department.' } });
  }
};
