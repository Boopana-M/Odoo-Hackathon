import { connectDB, mongoose } from './config/db.js';
import { 
  User, Employee, Department, AssetCategory, Asset, 
  Allocation, ResourceBooking, MaintenanceRequest, 
  ROLES, ASSET_LIFECYCLE, ALLOCATION_STATUS 
} from './models/index.js';

const seedData = async () => {
  try {
    await connectDB();
    console.log('Dropping existing database...');
    await mongoose.connection.db.dropDatabase();

    console.log('Seeding Departments...');
    const itDept = await Department.create({ name: 'IT', description: 'Information Technology', isActive: true });
    const hrDept = await Department.create({ name: 'HR', description: 'Human Resources', isActive: true });
    const opsDept = await Department.create({ name: 'Operations', description: 'Operations Team', isActive: true });
    const finDept = await Department.create({ name: 'Finance', description: 'Finance Department', isActive: true });

    console.log('Seeding Users & Employees...');
    const adminUser = await User.create({ email: 'admin@assetflow.com', password: 'password123', role: ROLES.ADMIN, isActive: true });
    await Employee.create({ userId: adminUser._id, name: 'Admin User', empId: 'EMP001', departmentId: itDept._id });

    const managerUser = await User.create({ email: 'manager@assetflow.com', password: 'password123', role: ROLES.ASSET_MANAGER, isActive: true });
    const managerEmp = await Employee.create({ userId: managerUser._id, name: 'Asset Manager', empId: 'EMP002', departmentId: opsDept._id });

    const headUser = await User.create({ email: 'head@assetflow.com', password: 'password123', role: ROLES.DEPARTMENT_HEAD, isActive: true });
    const headEmp = await Employee.create({ userId: headUser._id, name: 'Department Head', empId: 'EMP003', departmentId: hrDept._id });

    const empUser = await User.create({ email: 'employee@assetflow.com', password: 'password123', role: ROLES.EMPLOYEE, isActive: true });
    const employeeEmp = await Employee.create({ userId: empUser._id, name: 'Regular Employee', empId: 'EMP004', departmentId: hrDept._id });

    const techUser = await User.create({ email: 'tech@assetflow.com', password: 'password123', role: ROLES.EMPLOYEE, isActive: true });
    await Employee.create({ userId: techUser._id, name: 'Technician', empId: 'EMP005', departmentId: itDept._id });

    console.log('Seeding Asset Categories...');
    const catLaptops = await AssetCategory.create({ name: 'Laptops', prefix: 'LAP', requiresMaintenance: true, expectedLifespanYears: 3, isActive: true });
    const catMonitors = await AssetCategory.create({ name: 'Monitors', prefix: 'MON', requiresMaintenance: false, expectedLifespanYears: 5, isActive: true });
    const catVehicles = await AssetCategory.create({ name: 'Vehicles', prefix: 'VEH', requiresMaintenance: true, expectedLifespanYears: 10, isActive: true });
    const catMeetingRooms = await AssetCategory.create({ name: 'Meeting Rooms', prefix: 'MR', requiresMaintenance: true, expectedLifespanYears: 10, isActive: true });

    console.log('Seeding Assets...');
    const asset1 = await Asset.create({
      name: 'MacBook Pro 16',
      assetTag: 'AF-0001',
      categoryId: catLaptops._id,
      lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED,
      acquisitionCost: 2500,
      acquisitionDate: new Date('2023-01-15')
    });

    const asset2 = await Asset.create({
      name: 'Dell UltraSharp 27',
      assetTag: 'AF-0002',
      categoryId: catMonitors._id,
      lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE,
      acquisitionCost: 400,
      acquisitionDate: new Date('2024-02-10')
    });

    const asset3 = await Asset.create({
      name: 'Conference Room A',
      assetTag: 'AF-0003',
      categoryId: catMeetingRooms._id,
      lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE,
      isSharedBookable: true,
      acquisitionCost: 10000,
      acquisitionDate: new Date('2022-05-01')
    });

    const asset4 = await Asset.create({
      name: 'Delivery Van',
      assetTag: 'AF-0004',
      categoryId: catVehicles._id,
      lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED,
      departmentId: opsDept._id,
      acquisitionCost: 35000,
      acquisitionDate: new Date('2023-11-20')
    });

    console.log('Seeding Allocations...');
    const alloc1 = await Allocation.create({
      assetId: asset1._id,
      employeeId: employeeEmp._id,
      assignedBy: adminUser._id,
      status: ALLOCATION_STATUS.ACTIVE,
      allocatedAt: new Date()
    });
    asset1.currentAllocationId = alloc1._id;
    await asset1.save();

    const alloc4 = await Allocation.create({
      assetId: asset4._id,
      departmentId: opsDept._id,
      assignedBy: managerUser._id,
      status: ALLOCATION_STATUS.ACTIVE,
      allocatedAt: new Date()
    });
    asset4.currentAllocationId = alloc4._id;
    await asset4.save();

    console.log('Seeding Maintenance Requests...');
    await MaintenanceRequest.create({
      assetId: asset1._id,
      raisedBy: empUser._id,
      raisedByEmployee: employeeEmp._id,
      issueDescription: 'Screen flickering occasionally',
      priority: 'Medium',
      status: 'Pending'
    });

    await MaintenanceRequest.create({
      assetId: asset4._id,
      raisedBy: managerUser._id,
      raisedByEmployee: managerEmp._id,
      issueDescription: 'Oil change due',
      priority: 'Low',
      status: 'In Progress',
      assignedTechnician: techUser._id
    });

    console.log('Seeding Resource Bookings...');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    await ResourceBooking.create({
      assetId: asset3._id,
      bookedBy: empUser._id,
      bookedByEmployee: employeeEmp._id,
      startTime: tomorrow,
      endTime: dayAfter,
      purpose: 'Team sync meeting',
      status: 'Upcoming'
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed DB:', err);
    process.exit(1);
  }
};

seedData();
