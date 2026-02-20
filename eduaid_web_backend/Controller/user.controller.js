
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import  UserModel  from "./../DB/user.db.js";

const RegisterUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(username, email, password);
    const user = await UserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (user) {
      return res.status(404).json({ message: "User exists already ,do login" });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const newuser = await UserModel.create({
      username,
      email,
      password: hashpassword,
    });
    const createduser = await UserModel.findById(newuser._id);
    if (!createduser) {
      return res
        .status(404)
        .json({ message: "Server issue while creating user" });
    }
    res
      .status(200)
      .json(
        { message: "User registered successfully", success: "true", user: createduser }
      );
  } catch (error) {
    return res
      .status(404)
      .json({ message: `Having error in the registering user ${error}` });
  }
};
const LoginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({
    $or: [{ email }],
  });
  if (!user) {
    return res
      .status(404)
      .json({ message: "User is not exists in the database , do register " });
  }
  const ispasscorrect = await bcrypt.compare(password, user.password);
  console.log(ispasscorrect);
  if (!ispasscorrect) {
    return res.status(404).json({ message: "wrong password " });
  }
  const jsonewbestoken = jwt.sign(
    { email: user.email, _id: user.id },
    process.env.Authentication_for_jsonwebtoken,
    { expiresIn: "24h" }
  );
  res.status(200).json({
    message: "User login successfully",
    success: "true",
    user: user,
    jwttoken: jsonewbestoken,
  });
};


export {
  RegisterUser,
  LoginUser,
};