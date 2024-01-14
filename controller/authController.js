const User = require("../models/user")
const {StatusCodes} = require("http-status-codes")
const {BadRequestError,UnauthenticatedError} = require("../error/index")
const CustomError = require("../error/index")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createJWT, attachCookiesToResponce } = require("../utils/index")
const createTokenUser = require("../utils/createTokenUser")
const register = async (req,res,next)=>{
  // const {name,email,password} = req.body
  // // if(!name || !email || !password){
  // //   return next(new BadRequestError("Please provide name, email and password"))
  // // }
  // const salt = await bcrypt.genSalt(10)
  // const hashPassword  = await bcrypt.hash(password,salt)

  // const tempUser = {name,email,password:hashPassword}
  const {name,email,password} = req.body

  const emailAllreadyExist = await User.findOne({email})
  if (emailAllreadyExist){
    throw new BadRequestError('Email Allready Exist!!!')
  }
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin':'user'
  
  const user = await User.create({ name, email, password, role})
  const tokenUser = {name:user.name,userId:user._id,role:user.role}
  attachCookiesToResponce({res,user:tokenUser})

  res.status(StatusCodes.CREATED).json({ user: tokenUser });

  // const token = createJWT({payload:tokenUser})
  // const token = jwt.sign({userId:user._id,name:user.name},'jwtSecret',{
  //   expiresIn:'30d'
  // })
  // const oneDay = 1000*60*60*24
  // res.cookie('token',token,{
  //   httpOnly:true,
  //   expires:new Date(Date.now() + oneDay)
  // })
  // res.status(StatusCodes.CREATED).json({user:tokenUser})
  // res.status(StatusCodes.CREATED).json({user:{name:user.getName()},token})

}

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const tokenUser = createTokenUser(user);
  attachCookiesToResponce({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};
const logout = async (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now() + 1000),
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};

module.exports = {register,login,logout}