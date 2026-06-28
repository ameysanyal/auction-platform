import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    // Ensure the connection string exists before attempting to connect
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
    } else {
      console.error("An unknown MongoDB connection error occurred:", error);
    }
    process.exit(1);
  }
};

export default connectDB;