import 'dotenv/config';
import app from "./src/app.js";
import { connectDB } from "./src/db/db.js";

const PORT = process.env.PORT || 3001;


connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at PORT: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting DB from server: ", error);
    process.exit(1);
  });
