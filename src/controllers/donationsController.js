const mongoose = require("mongoose");
const model = require("../models/donations");
const User = require("../models/users");
const multer = require("multer");
const multerConfig = require("../libs/multerConfig");
const { unlink } = require("fs-extra");
const { httpError } = require("../helpers/handleError");
const path = require("path");
const auth = require("./authController");
const validations = require("../validators/donation");
const fs = require("fs");

const parseId = (id) => {
  return mongoose.Types.ObjectId(id);
};

const upload = multer(multerConfig).single("file");

exports.fileUpload = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      res.send({ message: error });
    } else {
      return next();
    }
  });
};

exports.createDonations = async (req, res) => {
  try {
    const data = req.body;
    const token = req.headers["x-access-token"];
    const errors = validations.validate(req);

    if (errors) {
      return res.status(406).send(errors);
    } else {
      const decoded = auth.decoded(token);
      data.user_id = decoded.id;

      if (req?.file && req?.file?.filename) {
        data.imgURL = `${req?.file?.filename}`;
      }
      data.status = "undefined";

      const donation = new model(data);
      await donation.save();
      const user = await User.findById({ _id: donation.user_id });
      const response = populateUser(donation, user);
      res.status(201).send(response);
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.getDonations = async (req, res) => {
  try {
    const docs = await model.find({});
    if (!docs) {
      res.status(404).send({});
    } else {
      const users = await User.find({});
      const response = populateUsers(docs, users);
      res.status(200).send(response);
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.getDonationsById = async (req, res) => {
  try {
    const id = req.params.id;

    const doc = await model.findById({ _id: parseId(id) });

    if (!doc) {
      res.status(404).send({});
    } else {
      const user = await User.findById({ _id: doc.user_id });
      const response = populateUser(doc, user);
      res.status(200).send(response);
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.updateDonationsById = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const errors = validations.validateUpdate(req, res);

    if (errors) {
      return res.status(406).send(errors);
    } else {
      const donation = await model.findById({ _id: parseId(id) });

      if (!donation) {
        if (req?.file?.filename) {
          unlink(path.resolve("./public/uploads/" + req.file.filename));
        }
        return res
          .status(404)
          .send({ message: "La donacion que desea actualizar no existe" });
      }

      if (req?.file && req?.file?.filename) {
        body.imgURL = req?.file?.filename;
        unlink(path.resolve("./public/uploads/" + donation.imgURL));
      } else {
        body.imgURL = donation.imgURL;
      }

      await model.updateOne({ _id: parseId(id) }, body);
      const doc = await model.findById({ _id: parseId(id) });

      const user = await User.findById({ _id: doc.user_id });
      const response = populateUser(doc, user);
      return res.status(200).send(response);
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.deleteDonationsById = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await model.findOneAndDelete({ _id: parseId(id) });
    if (!doc)
      return res
        .status(404)
        .send({ message: "La donacion que desea borrar no existe" });

    if (doc.imgURL !== "ifgf.png") {
      if (fs.existsSync(path.resolve("./public/uploads/" + doc.imgURL))) {
        unlink(path.resolve("./public/uploads/" + doc.imgURL));
      }
    }
    res.status(200).send({ message: "Eliminado con éxito" });
  } catch (error) {
    httpError(res, error);
  }
};

function populateUsers(data, users) {
  const donations = data;
  const jsonResponse = [];
  for (const donation of donations) {
    for (const user of users) {
      if (JSON.stringify(donation.user_id) === JSON.stringify(user._id)) {
        const newData = {
          user: {
            user_id: user._id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            cellphone: user.cellphone,
          },
          _id: donation._id,
          description: donation.description,
          type: donation.type,
          delivery: donation.delivery,
          address: donation.address,
          date: donation.date,
          status: donation.status,
          message: donation.message,
          imgURL: donation.imgURL,
        };
        jsonResponse.push(newData);
      }
    }
  }
  return jsonResponse;
}

function populateUser(data, user) {
  const donation = data;
  const jsonResponse = { user: {} };

  jsonResponse.user = {
    user_id: donation.user_id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    cellphone: user.cellphone,
  };
  jsonResponse._id = donation._id;
  jsonResponse.description = donation.description;
  jsonResponse.type = donation.type;
  jsonResponse.delivery = donation.delivery;
  jsonResponse.address = donation.address;
  jsonResponse.date = donation.date;
  jsonResponse.status = donation.status;
  jsonResponse.message = donation.message;
  jsonResponse.imgURL = donation.imgURL;

  return jsonResponse;
}
