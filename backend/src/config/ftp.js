"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFtpClient = getFtpClient;
const ftp = __importStar(require("basic-ftp"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function getFtpClient() {
    const client = new ftp.Client(30000); // 30s timeout
    client.ftp.verbose = true; // VERY IMPORTANT: Let's see the logs in the backend terminal
    await client.access({
        host: process.env.FTP_HOST || "localhost",
        user: process.env.FTP_USER || "anonymous",
        password: process.env.FTP_PASS || "",
        port: parseInt(process.env.FTP_PORT || "21"),
        // Le serveur exige explicitement le TLS (Erreur 530 TLS Required)
        secure: true,
        secureOptions: { rejectUnauthorized: false }
    });
    return client;
}
//# sourceMappingURL=ftp.js.map