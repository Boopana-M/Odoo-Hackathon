import { connectDB, mongoose } from '../config/db.js';
import {
  User,
  Employee,
  Department,
  AssetCategory,
  Asset,
  Allocation,
  ResourceBooking,
  MaintenanceRequest,
  AuditCycle,
  AuditItem,
  Notification,
  ActivityLog,
  ROLES,
  ASSET_LIFECYCLE,
  ALLOCATION_STATUS,
  MAINTENANCE_STATUS,
  MAINTENANCE_PRIORITY,
  BOOKING_STATUS,
  AUDIT_STATUS,
  AUDIT_SCOPE_TYPE,
  VERIFICATION_RESULT,
  NOTIFICATION_TYPE,
  ACTIVITY_ACTION
} from '../models/index.js';

async function seed() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await AssetCategory.deleteMany({});
    await Asset.deleteMany({});
    await Allocation.deleteMany({});
    await ResourceBooking.deleteMany({});
    await MaintenanceRequest.deleteMany({});
    await AuditCycle.deleteMany({});
    await AuditItem.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('Seeding departments...');
    const executiveDept = await Department.create({ name: 'Executive', status: 'Active' });
    const operationsDept = await Department.create({ name: 'Operations', status: 'Active' });
    const marketingDept = await Department.create({ name: 'Sales & Marketing', status: 'Active' });
    const engineeringDept = await Department.create({ name: 'Engineering', status: 'Active' });
    const productDept = await Department.create({ name: 'Product Management', status: 'Active' });

    console.log('Seeding users & employee directory...');
    
    // Admin user (Manoj V)
    const adminUser = await User.create({
      email: 'admin@assetflow.com',
      password: 'admin123',
      role: ROLES.ADMIN,
      isActive: true
    });
    const adminEmployee = await Employee.create({
      name: 'Manoj V',
      userId: adminUser._id,
      departmentId: engineeringDept._id,
      isActive: true
    });
    
    // Asset Manager user
    const managerUser = await User.create({
      email: 'manager@assetflow.com',
      password: 'manager123',
      role: ROLES.ASSET_MANAGER,
      isActive: true
    });
    const managerEmployee = await Employee.create({
      name: 'Bob Smith',
      userId: managerUser._id,
      departmentId: operationsDept._id,
      isActive: true
    });

    // Department Head user (Sarah Connor)
    const headUser = await User.create({
      email: 'head@assetflow.com',
      password: 'head123',
      role: ROLES.DEPARTMENT_HEAD,
      isActive: true
    });
    const headEmployee = await Employee.create({
      name: 'Sarah Connor',
      userId: headUser._id,
      departmentId: marketingDept._id,
      isActive: true
    });

    // Regular Employee user (Alice Vance)
    const empUser = await User.create({
      email: 'employee@assetflow.com',
      password: 'employee123',
      role: ROLES.EMPLOYEE,
      isActive: true
    });
    const empEmployee = await Employee.create({
      name: 'Alice Vance',
      userId: empUser._id,
      departmentId: productDept._id,
      isActive: true
    });

    // Update departments with managers
    engineeringDept.managerId = adminEmployee._id;
    await engineeringDept.save();

    operationsDept.managerId = managerEmployee._id;
    await operationsDept.save();

    marketingDept.managerId = headEmployee._id;
    await marketingDept.save();

    productDept.managerId = empEmployee._id;
    await productDept.save();

    console.log('Seeding asset categories...');
    const catIT = await AssetCategory.create({
      name: 'IT Hardware',
      description: 'Laptops, Monitors, Servers and Workstations',
      fieldDefinitions: [
        { key: 'ram', label: 'RAM Size (GB)', type: 'number', required: true },
        { key: 'processor', label: 'Processor Type', type: 'string', required: false }
      ],
      isActive: true
    });

    const catFurniture = await AssetCategory.create({
      name: 'Office Furniture',
      description: 'Desks, Chairs, Conference room tables',
      fieldDefinitions: [
        { key: 'material', label: 'Material Wood/Steel', type: 'string', required: false }
      ],
      isActive: true
    });

    const catVehicles = await AssetCategory.create({
      name: 'Vehicles',
      description: 'Company cars and delivery vans',
      fieldDefinitions: [
        { key: 'licensePlate', label: 'License Plate No.', type: 'string', required: true }
      ],
      isActive: true
    });

    console.log('Seeding assets...');
    const asset1 = await Asset.create({
      name: 'Dell Laptop XPS 15',
      categoryId: catIT._id,
      assetTag: 'AF-0012',
      serialNumber: 'SN-DELL-XPS15-9982',
      acquisitionCost: 1200,
      condition: 'Good',
      location: 'Bengaluru, Desk 12',
      isSharedBookable: false,
      lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED,
      customFields: { ram: 16, processor: 'Intel i7' }
    });

    const asset2 = await Asset.create({
      name: 'Sony Projector 4K',
      categoryId: catIT._id,
      assetTag: 'AF-0062',
      serialNumber: 'SN-SONY-PROJ-8817',
      acquisitionCost: 800,
      condition: 'Fair',
      location: 'HQ Floor 2',
      isSharedBookable: true,
      lifecycleStatus: ASSET_LIFECYCLE.UNDER_MAINTENANCE,
      customFields: { ram: 4 }
    });

    const asset3 = await Asset.create({
      name: 'Ergonomic Office Chair',
      categoryId: catFurniture._id,
      assetTag: 'AF-0201',
      serialNumber: 'SN-CHAIR-ERG-7711',
      acquisitionCost: 250,
      condition: 'Good',
      location: 'Warehouse A',
      isSharedBookable: true,
      lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE,
      customFields: { material: 'Mesh' }
    });

    const asset4 = await Asset.create({
      name: 'Company Van',
      categoryId: catVehicles._id,
      assetTag: 'AF-0334',
      serialNumber: 'SN-VAN-FORD-5511',
      acquisitionCost: 25000,
      condition: 'Good',
      location: 'Field Ops East',
      isSharedBookable: true,
      lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED,
      customFields: { licensePlate: 'KA-03-MB-4512' }
    });

    console.log('Seeding allocations...');
    // Allocation to employee (departmentId must be null)
    const allocation1 = await Allocation.create({
      assetId: asset1._id,
      employeeId: empEmployee._id,
      departmentId: null,
      allocatedBy: managerEmployee._id,
      allocationDate: new Date(),
      status: ALLOCATION_STATUS.ACTIVE,
      notes: 'Assigned for daily product tasks.'
    });

    // Allocation to department (employeeId must be null)
    await Allocation.create({
      assetId: asset4._id,
      employeeId: null,
      departmentId: marketingDept._id,
      allocatedBy: adminEmployee._id,
      allocationDate: new Date(),
      status: ALLOCATION_STATUS.ACTIVE,
      notes: 'Allocated for product launch operations.'
    });

    console.log('Seeding bookings...');
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await ResourceBooking.create({
      assetId: asset3._id, // Bookable chair
      bookedBy: empUser._id,
      bookedByEmployee: empEmployee._id,
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0),
      status: BOOKING_STATUS.UPCOMING,
      purpose: 'Design session sprint'
    });

    await ResourceBooking.create({
      assetId: asset2._id, // Under maintenance projector
      bookedBy: headUser._id,
      bookedByEmployee: headEmployee._id,
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 0, 0),
      status: BOOKING_STATUS.UPCOMING,
      purpose: 'Marketing Q3 Review'
    });

    console.log('Seeding maintenance requests...');
    await MaintenanceRequest.create({
      assetId: asset2._id,
      raisedBy: empUser._id,
      raisedByEmployee: empEmployee._id,
      issueDescription: 'Lenses are blurry and power cycling randomly.',
      priority: MAINTENANCE_PRIORITY.HIGH,
      status: MAINTENANCE_STATUS.APPROVED,
      assignedTechnician: adminUser._id
    });

    console.log('Seeding audit cycle...');
    const auditCycle = await AuditCycle.create({
      title: 'Q2 Physical Assets Verification',
      startDate: new Date(),
      endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      scopeType: AUDIT_SCOPE_TYPE.DEPARTMENT,
      scopeDepartmentId: productDept._id,
      auditors: [adminUser._id],
      status: AUDIT_STATUS.OPEN
    });

    await AuditItem.create({
      auditCycleId: auditCycle._id,
      assetId: asset1._id,
      verifiedBy: adminUser._id,
      verifiedAt: new Date(),
      verificationResult: VERIFICATION_RESULT.VERIFIED,
      notes: 'Good condition check.'
    });

    console.log('Seeding activity logs...');
    await ActivityLog.create({
      actorUserId: adminUser._id,
      actorEmployeeId: adminEmployee._id,
      action: ACTIVITY_ACTION.ASSET_CREATED,
      entityType: 'Asset',
      entityId: asset1._id,
      metadata: { detail: 'Registered asset: Dell Laptop XPS 15 (AF-0012).' }
    });

    await ActivityLog.create({
      actorUserId: managerUser._id,
      actorEmployeeId: managerEmployee._id,
      action: ACTIVITY_ACTION.ASSET_ALLOCATED,
      entityType: 'Allocation',
      entityId: allocation1._id,
      metadata: { detail: 'Allocated asset AF-0012 to Alice Vance.' }
    });

    console.log('Seeding notifications...');
    await Notification.create({
      recipientUserId: empUser._id,
      recipientEmployeeId: empEmployee._id,
      title: 'New Asset Assigned',
      message: 'You have been assigned a new laptop: Dell Laptop XPS 15 (AF-0012).',
      type: NOTIFICATION_TYPE.ASSET_ASSIGNED,
      isRead: false
    });

    await Notification.create({
      recipientUserId: headUser._id,
      recipientEmployeeId: headEmployee._id,
      title: 'Booking Confirmed',
      message: 'Your booking for Sony Projector 4K has been confirmed for tomorrow 2PM.',
      type: NOTIFICATION_TYPE.BOOKING_CONFIRMED,
      isRead: false
    });

    console.log('Seeding complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
