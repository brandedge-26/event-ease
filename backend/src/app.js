import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";




// EXPRESS APP
export const app = express();



// COOKIE PARSING
app.use(cookieParser());




// PARSING INCOMING DATA
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));



// CORS CONFIGURATION
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));




// API HEALTH
app.get("/", (req, res) => {
    res.end("Welcome to Event Ease Server...");
});