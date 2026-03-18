"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'djbrain-secret-key-12345';
const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Accès non autorisé : Veuillez vous connecter' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Add user info to request
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Session invalide ou expirée' });
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.js.map