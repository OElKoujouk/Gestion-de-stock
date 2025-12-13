"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowRoles = allowRoles;
function allowRoles(...allowed) {
    return function roleGuard(req, res, next) {
        if (!req.user)
            return res.status(403).json({ message: "Accès refusé" });
        if (req.user.role === "superadmin")
            return next();
        if (!allowed.includes(req.user.role))
            return res.status(403).json({ message: "Accès refusé" });
        next();
    };
}
