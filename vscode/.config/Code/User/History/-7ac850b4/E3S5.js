import "dotenv/config";
config();
import express from "express";
import cors from "cors";
import connectDB from "./config/database";
import authRoutes from "./routes/authRoutes";
import bookRoutes from "./routes/bookRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import errorHandler from "./middleware/errorHandler";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const allowedOrigins = [process.env.FRONTEND_URL];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api", reviewRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
