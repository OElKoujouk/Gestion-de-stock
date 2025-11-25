"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowRoles = allowRoles;
function allowRoles(...allowed) {
    return function roleGuard(req, res, next) {
        if (!req.user || !allowed.includes(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé" });
        }
        next();
    };
}
