"use strict";

/* ======================================================
   ROLE-BASED AUTHORIZATION MIDDLEWARE
====================================================== */

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // 1. Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }

    // 2. Validate configured roles
    if (roles.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // 3. Check account status
    if (req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // 4. Check role authorization
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource.",
      });
    }

    // 5. Allow access
    return next();
  };
};

/* ======================================================
   EXPORT
====================================================== */

module.exports = {
  authorizeRoles,
};
