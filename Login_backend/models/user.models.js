import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
  email: {
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
  },
  password: {
    type: String, 
    required: true, 
    minlength: 6, 
    select:false
  },
}, { timestamps: true }); 
userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 12);
};

userSchema.methods.matchpassword=async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateJWT=async function(email){
    return jwt.sign({ email: this.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

}
const User=mongoose.model("APIuser",userSchema);
export default User;
