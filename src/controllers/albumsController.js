const mongoose = require("mongoose");
const model = require("../models/album");


const parseId = (id) => {
  return mongoose.Types.ObjectId(id);
};

exports.getAlbums = (req, res) => {
  model.find({}, (err, docs) => {
    res.send(docs);
  });
};

exports.getAlbumsById = async (req, res) => {
  const id = req.params.id;
  const product = await model.findById({ _id: parseId(id) });
  if (product == null) {
    res.status(200).send("null");
  } else {
    res.status(200).send(product);
  }
};

exports.updateAlbumsById = (req, res) => {
  const id = req.params.id;
  const body = req.body;
  //const { id } = req.params
  model.updateOne({ _id: parseId(id) }, body, (err, docs) => {
    res.send(docs);
  });
};

exports.deleteAlbumsById = (req, res) => {
  const id = req.params.id;
  //const { id } = req.params
  model.deleteOne({ _id: parseId(id) }, (err, docs) => {
    res.send(docs);
  });
};
