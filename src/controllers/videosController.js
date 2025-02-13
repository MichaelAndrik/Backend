const mongoose = require("mongoose");
const { httpError } = require("../helpers/handleError");
const model = require("../models/videos");
const validations = require("../validators/videos");

const parseId = (id) => {
  return mongoose.Types.ObjectId(id);
};

exports.createVideos = async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    const errors = validations.validate(req);

    if (errors) {
      return res.status(406).send(errors);
    } else {
      const doc = await model.findOne({ url: data.url });
      if (doc) return res.status(400).send({ message: "El video ya existe" });

      await model.create(data, (err, docs) => {
        return res.status(201).send(docs);
      });
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.getVideos = async (req, res) => {
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

exports.getVideosById = async (req, res) => {
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

exports.updateVideosById = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;

    const errors = validations.validateUpdate(req);

    if (errors) {
      return res.status(406).send(errors);
    } else {
      const video = await model.findById({ _id: parseId(id) });
      if (!video) {
        return res
          .status(404)
          .send({ message: "El video que desea actualizar no existe" });
      }

      const doc1 = await model.findOne({ url: body.url });
      if (doc1) {
        return res.status(406).send({ message: "El video ya existe" });
      }

      await model.updateOne({ _id: parseId(id) }, body);
      const doc = await model.findById({ _id: parseId(id) });
      return res.status(200).send(doc);
    }
  } catch (error) {
    httpError(res, error);
  }
};

exports.deleteVideosById = async (req, res) => {
  try {
    const id = req.params.id;

    const video = await model.findById({ _id: parseId(id) });
    if (!video)
      return res
        .status(404)
        .send({ message: "El video que desea borrar no existe" });

    model.deleteOne({ _id: parseId(id) }, (err, docs) => {
      if (err) {
        console.log("Error", err);
        res
          .status(422)
          .send({ error: "El formato de datos ingresado es erroneo" });
      } else {
        res.status(200).send({ message: "Eliminado con éxito" });
      }
    });
  } catch (error) {
    httpError(res, error);
  }
};
