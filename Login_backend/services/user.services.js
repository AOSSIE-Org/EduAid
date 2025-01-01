import userModel from '../models/user.models.js';

export const createUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Please provide email and password");
  }


  const hashedPassword = await userModel.hashPassword(password); 
  const user = await userModel.create({ email, password: hashedPassword });

  return user; 
};
export default createUser;