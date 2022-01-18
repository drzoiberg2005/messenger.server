const { Schema, model, Types } = require('mongoose')

const schema = new Schema({
    users: { type: Array, default: [] },
    date: { type: Date, default: Date.now },
    updated: { type: Date },
})

module.exports = model('Room', schema)