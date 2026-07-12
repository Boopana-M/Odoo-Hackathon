import { Department, Employee, ROLES } from '../../models/index.js';

// ── Create a Department ──────────────────────────────────────────────────────
/**
 * POST /api/departments
 * Admin only.
 */
export const createDepartment = async (req, res) => {
  try {
    const { name, departmentHeadId, parentDepartmentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: { message: 'Department name is required.' } });
    }

    const dept = new Department({ name: name.trim() });

    if (departmentHeadId) {
      const head = await Employee.findById(departmentHeadId);
      if (!head) {
        return res.status(400).json({ error: { message: 'Invalid Department Head ID.' } });
      }
      dept.departmentHeadId = departmentHeadId;
    }

    if (parentDepartmentId) {
      const parent = await Department.findById(parentDepartmentId);
      if (!parent) {
        return res.status(400).json({ error: { message: 'Invalid Parent Department ID.' } });
      }
      dept.parentDepartmentId = parentDepartmentId;
    }

    await dept.save();
    return res.status(201).json({ message: 'Department created.', department: dept });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: 'Department name already exists.' } });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    return res.status(500).json({ error: { message: 'Failed to create department.' } });
  }
};

// ── List Departments ─────────────────────────────────────────────────────────
/**
 * GET /api/departments
 * Admin, Asset Manager, Department Head, Employee (Auth only)
 */
export const listDepartments = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const departments = await Department.find(filter)
      .populate('departmentHeadId')
      .populate('parentDepartmentId')
      .sort({ name: 1 });

    return res.status(200).json({ departments, total: departments.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list departments.' } });
  }
};

// ── Get Department ───────────────────────────────────────────────────────────
/**
 * GET /api/departments/:id
 * Auth only
 */
export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('departmentHeadId')
      .populate('parentDepartmentId');

    if (!department) {
      return res.status(404).json({ error: { message: 'Department not found.' } });
    }
    return res.status(200).json({ department });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid department ID.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to retrieve department.' } });
  }
};

// ── Update Department ────────────────────────────────────────────────────────
/**
 * PUT /api/departments/:id
 * Admin only
 */
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentHeadId, parentDepartmentId, isActive } = req.body;

    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ error: { message: 'Department not found.' } });
    }

    if (name !== undefined && name.trim()) {
      dept.name = name.trim();
    }

    if (departmentHeadId !== undefined) {
      if (departmentHeadId) {
        const head = await Employee.findById(departmentHeadId);
        if (!head) {
          return res.status(400).json({ error: { message: 'Invalid Department Head ID.' } });
        }
        dept.departmentHeadId = departmentHeadId;
      } else {
        dept.departmentHeadId = null;
      }
    }

    if (parentDepartmentId !== undefined) {
      if (parentDepartmentId) {
        if (parentDepartmentId === id) {
           return res.status(400).json({ error: { message: 'A department cannot be its own parent.' } });
        }
        
        // Check for cyclic dependency (basic 1 level check for now)
        const parent = await Department.findById(parentDepartmentId);
        if (!parent) {
          return res.status(400).json({ error: { message: 'Invalid Parent Department ID.' } });
        }
        if (parent.parentDepartmentId && parent.parentDepartmentId.toString() === id) {
           return res.status(400).json({ error: { message: 'Invalid parent relationship. Cyclic dependency detected.' } });
        }

        dept.parentDepartmentId = parentDepartmentId;
      } else {
        dept.parentDepartmentId = null;
      }
    }

    if (isActive !== undefined && typeof isActive === 'boolean') {
      dept.isActive = isActive;
    }

    await dept.save();

    return res.status(200).json({ message: 'Department updated.', department: dept });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: 'Department name already exists.' } });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update department.' } });
  }
};
