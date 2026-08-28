import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import passport from "./config/passport.js";
import apiRoutes from "./routes/index.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";



// EXPRESS APP
export const app = express();



// SECURITY HEADERS
app.use(helmet());



// COOKIE PARSING
app.use(cookieParser());




// PARSING INCOMING DATA
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));



// CORS CONFIGURATION
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));




// PASSPORT (no sessions — JWT only)
app.use(passport.initialize());

// ROUTES
app.use("/api", apiRoutes);

// API HEALTH
app.get("/", (req, res) => {
    res.end("Welcome to Event Ease Server...");
});






// Error Handling Middleware
app.use(globalErrorHandler);