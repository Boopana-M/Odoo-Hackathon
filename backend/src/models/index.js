import { mongoose } from '../config/db.js';
import User, { ROLES } from './User.js';
import Employee from './Employee.js';
import Department from './Department.js';
import AssetCategory from './AssetCategory.js';
import Asset, { ASSET_LIFECYCLE } from './Asset.js';

export {
  mongoose,
  User,
  Employee,
  Department,
  AssetCategory,
  Asset,
  ROLES,
  ASSET_LIFECYCLE
};
