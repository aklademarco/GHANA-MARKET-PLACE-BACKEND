import express from "express";
import "dotenv/config";
import v1Routes from "./routes/v1/index.js";


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get("/", (req, res)=>{
    res.json({
        message: "Ghana Marketplace API",
        status: "running",
        version: "1.0.0"
        
    });
});

//API Routes -v1

app.use("/api/v1", v1Routes);


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
