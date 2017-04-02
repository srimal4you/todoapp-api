var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var todoSchema = new Schema({
  name: String,
  id: Number,
  description: String,
  completed: Boolean
})

module.exports = mongoose.model('todo', todoSchema);