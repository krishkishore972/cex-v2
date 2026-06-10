import express from "express";
import authRouter from "./routers/auth/auth";


const app = express();
app.use(express.json());


// Register routers
app.use("/auth", authRouter);



app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
