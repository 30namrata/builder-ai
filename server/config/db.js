
import mongoose from "mongoose";

export async function connectToDB() {
    mongoose.connection.on("connected", () => {
        console.log("Serevr is connect to the databse ")
    })
    await mongoose.connect(process.env.MONGO_URL)


}