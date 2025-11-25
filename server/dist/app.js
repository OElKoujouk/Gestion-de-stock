"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("./middleware/auth");
const tenant_1 = require("./middleware/tenant");
const router_1 = require("./router");
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
exports.app.use((0, router_1.apiRouter)(auth_1.authMiddleware, tenant_1.tenantMiddleware));
