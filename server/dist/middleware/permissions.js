"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAbility = requireAbility;
const permissions_1 = require("../permissions");
function requireAbility(ability) {
    return function abilityMiddleware(req, res, next) {
        if (!req.user || !(0, permissions_1.hasAbility)(req.user.permissions, ability)) {
            return res.status(403).json({ message: "Accès refusé pour cette action" });
        }
        next();
    };
}
