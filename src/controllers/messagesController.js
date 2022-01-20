const mongoose = require("mongoose");
const model = require("../models/messages");
const multer = require("multer");
const multerConfig = require("../libs/multerConfig");
const { unlink } = require("fs-extra");
const { httpError } = require("../helpers/handleError");
const path = require("path");
const validations = require("../validators/info");

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

exports.createMessages = async (req, res) => {
  try {
    const data = req.body;
    const errors = validations.validate(req);

    if (errors) {
      return res.status(406).send(errors);
    } else {
      const doc = await model.findOne({ title: data.title });
      if (doc) {
        if (req.file?.filename) {
          unlink(path.resolve("./public/uploads/" + req.file?.filename));
        }
        return res.status(406).send({ message: "El mensaje ya existe" });
      }

      if (req.file && req.file.filename) {
        data.imgURL = `${req.file.filename}`;
      } else {
        data.imgURL = "ifgf.png";
      }

      await model.create(data, (err, docs) => {
        return res.status(201).send(docs);
      });
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const docs = await model.find({});
    if (!docs) {
      res.status(404).send({});
    } else {
      res.status(200).send(docs);
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.getMessagesById = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await model.findById({ _id: parseId(id) });
    if (!doc) {
      res.status(404).send({});
    } else {
      res.status(200).send(doc);
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.updateMessagesById = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const errors = validations.validateUpdate(req);

    if (errors) {
      return res.status(406).send(errors);
    } else {
      const message = await model.findById({ _id: parseId(id) });
      if (!message) {
        if (req.file?.filename) {
          unlink(path.resolve("./public/uploads/" + req.file.filename));
        }
        return res
          .status(404)
          .send({ message: "El mensaje que desea actualizar no existe" });
      }

      if (req.file && req.file.filename) {
        body.imgURL = req.file.filename;
        unlink(path.resolve("./public/uploads/" + message.imgURL));
      } else {
        body.imgURL = message.imgURL;
      }

      await model.updateOne({ _id: parseId(id) }, body);
      const doc = await model.findById({ _id: parseId(id) });
      return res.status(200).send(doc);
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.deleteMessagesById = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await model.findOneAndDelete({ _id: parseId(id) });
    if (!doc)
      return res
        .status(404)
        .send({ message: "El mensaje que desea borrar no existe" });

    if (doc.imgURL != "ifgf.png") {
      unlink(path.resolve("./public/uploads/" + doc.imgURL));
    }
    res.send({ message: "Eliminado con exito" });
  } catch (error) {
    httpError(res, error);
  }
};
