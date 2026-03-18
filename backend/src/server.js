"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDir = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const sync_1 = __importDefault(require("./routes/sync"));
const tracks_1 = __importDefault(require("./routes/tracks"));
const sync_2 = __importDefault(require("./routes/sync"));
const auth_1 = __importDefault(require("./routes/auth"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// S'assurer que le port d'upload existe
exports.uploadDir = process.env.UPLOAD_DIR || path_1.default.join(__dirname, '../../dj-library');
// Route Home
app.get('/', (req, res) => {
    res.send('DJ Brain API is running');
});
// Routes API
app.use('/api/auth', auth_1.default);
app.use('/api/tracks', tracks_1.default);
app.use('/api/sync', sync_2.default);
app.listen(port, () => {
    console.log(`[server]: Le serveur tourne sur http://localhost:${port}`);
    console.log(`[server]: Le volume backend de stockage audio est : ${exports.uploadDir}`);
});
//# sourceMappingURL=server.js.map