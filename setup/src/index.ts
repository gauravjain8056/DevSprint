import dotenv from "dotenv";
import { app } from "./app.js";
import { connectRedis } from "./config/redis.js";

dotenv.config({
  path: "./.env",
});

connectRedis()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Redis connection failed !!! ", err);
  });
