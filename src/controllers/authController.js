const User = require("../models/users");
const Role = require("../models/role");
const jwt = require("jsonwebtoken");
//const config = require('../config');


exports.register = async (req, res) => {
  //obtener datos
  const { name, lastname, email, password, roles } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if(!user){

      const newUser = new User({
        name,
        lastname,
        email,
        password: await User.encryptPassword(password),
      });

      if (roles) {
        const foundRoles = await Role.find({ name: { $in: roles } });
        newUser.roles = foundRoles.map((role) => role._id);
      } else {
        const role = await Role.findOne({ name: "user" });
        newUser.roles = [role._id];
      }
    
      //guardar usuario
      await newUser.save();
      res.status(200).send({ message: "Usuario registrado con exito" });
    }else{
      res.status(422).send({message: "Este usuario ya esta registrado"})
    }
    
  } catch (error) {
    console.error(error);

    return res.status(500).json({ errors: ["Ocurrio algun error"] });
  }

};

exports.login = async (req, res) => {

  const user = await User.findOne({ email: req.body.email });

  console.log(user);

  exports.resUser = user;

  if (!user){
    return res.send({ token: "",
    message: "usuario no encontrado" });
  }

  const roles = await Role.find({ _id: { $in: user.roles } });
  const roleName = await roles[0].name;

  const matchPassword = await User.comparePassword(
    req.body.password,
    user.password
  );

  if (!matchPassword){
    return res.send({ token:"",
    message: "Contraseña incorrecta" });
  }

  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
    expiresIn: 86400, //24h
  });
  return res.send(
    { token: token,
      role: roleName}
  );
};

exports.me = async (req, res) => {
  if (!this.resUser){
    return res.json({ errors: "login to get the info"});
  }else{
    return res.status(200).json({ user: this.resUser });
  }
  
}

exports.logout = (req, res) => {
  req.logout();
  res.status(200).json({ msg: "logged out" });
}