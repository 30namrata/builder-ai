import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema } = mongoose;

const UserSchema = new Schema({
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true, trim: true, lowercase: true },
    password: { type: String, require: true }


}, { timestamps: true });

//hash password before saving
UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})
//compare password method
UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}
export const User = mongoose.model("User", UserSchema);
