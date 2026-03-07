import express from "express";
import path from "path";
import helmet from "helmet";
import cookieParser from "cookie-parser"
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://youtube.com",
        "https://www.youtube-nocookie.com"
      ]
    }
  }
}));
app.use(express.static(path.join(__dirname, "public")));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * Import Routes
 */
import adminRoutes from "./routes/admin.route.js";
import contactRoutes from "./routes/contact.route.js";
import videoRoutes from "./routes/video.route.js";

/**
 * Use Routes
 */
app.use("/admin", adminRoutes);
app.use("/contact", contactRoutes);
app.use("/video", videoRoutes);

export default app;
