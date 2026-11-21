function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "You must log in first."
        });
    }

    next();
}


function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: "You must log in first."
            });
        }

        const userRole = req.session.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource."
            });
        }

        next();
    };
}


module.exports = {
    requireAuth,
    requireRole
};