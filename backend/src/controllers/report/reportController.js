import { Asset, Allocation, MaintenanceRequest, ResourceBooking, AuditItem, TransferRequest, AssetCategory, Department } from '../../models/index.js';

// ── Dashboard Metrics API ───────────────────────────────────────────────────
/**
 * GET /api/reports/dashboard
 * Admin, Asset Manager only.
 * Aggregates summary statistics for dashboard display.
 */
export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Total Assets and cost
    const totalAssets = await Asset.countDocuments();
    const costAgg = await Asset.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$acquisitionCost' } } }
    ]);
    const totalAssetValue = costAgg[0] ? costAgg[0].totalCost : 0;

    // 2. Assets by Status
    const statusAgg = await Asset.aggregate([
      { $group: { _id: '$lifecycleStatus', count: { $sum: 1 } } }
    ]);
    const assetsByStatus = statusAgg.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // 3. Assets by Category
    const categoryAgg = await Asset.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]);
    // Populate category names manually for reliability and ease
    const assetsByCategory = [];
    for (const cat of categoryAgg) {
      if (cat._id) {
        const category = await AssetCategory.findById(cat._id);
        assetsByCategory.push({
          categoryId: cat._id,
          categoryName: category ? category.name : 'Unknown',
          count: cat.count
        });
      }
    }

    // 4. Assets by Department (derived from Active allocations)
    const deptAgg = await Allocation.aggregate([
      { $match: { status: 'Active', departmentId: { $ne: null } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } }
    ]);
    const assetsByDepartment = [];
    for (const dept of deptAgg) {
      if (dept._id) {
        const department = await Department.findById(dept._id);
        assetsByDepartment.push({
          departmentId: dept._id,
          departmentName: department ? department.name : 'Unknown',
          count: dept.count
        });
      }
    }

    // 5. Active and Overdue Allocations
    const activeAllocations = await Allocation.countDocuments({ status: 'Active' });
    const overdueAllocations = await Allocation.countDocuments({
      status: 'Active',
      expectedReturnDate: { $lt: new Date() }
    });

    // 6. Active Maintenance Requests
    const activeMaintenance = await MaintenanceRequest.countDocuments({
      status: { $in: ['Pending', 'Approved', 'Technician Assigned', 'In Progress'] }
    });

    // 7. Booking Utilization Metrics
    const bookingAgg = await ResourceBooking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const bookingMetrics = bookingAgg.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // 8. Audit Discrepancies (Missing, Damaged)
    const discrepancyMissing = await AuditItem.countDocuments({ verificationResult: 'Missing' });
    const discrepancyDamaged = await AuditItem.countDocuments({ verificationResult: 'Damaged' });

    // 9. Workflow Summary Metrics (Transfers)
    const totalTransfers = await TransferRequest.countDocuments();
    const pendingTransfers = await TransferRequest.countDocuments({ status: 'Requested' });

    return res.status(200).json({
      summary: {
        assets: {
          totalCount: totalAssets,
          totalValue: totalAssetValue,
          byStatus: assetsByStatus,
          byCategory: assetsByCategory,
          byDepartment: assetsByDepartment
        },
        allocations: {
          activeCount: activeAllocations,
          overdueCount: overdueAllocations
        },
        maintenance: {
          activeCount: activeMaintenance
        },
        bookings: {
          metrics: bookingMetrics
        },
        audits: {
          discrepancies: {
            missing: discrepancyMissing,
            damaged: discrepancyDamaged
          }
        },
        transfers: {
          totalCount: totalTransfers,
          pendingCount: pendingTransfers
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to generate dashboard report summary.' } });
  }
};
