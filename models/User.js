const { Schema, model } = require('mongoose')

const schema = new Schema({
    telephone: { type: String, required: true, trim: true },
    code: { type: String, trim: true, required: false },
    status: { type: Boolean, default: false },
    socket: { type: String },
    expoPushToken: { type: Array, default: [] },
    contacts: { type: Array, default: [] },
    date: { type: Date, default: Date.now },
    updated: { type: Date },
})

module.exports = model('User', schema)