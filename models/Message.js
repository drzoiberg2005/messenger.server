const { Schema, model, Types } = require('mongoose')

const schema = new Schema({
    user: { type: Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    delivered: { type: Array },
    read: { type: Array },
    room: { type: Types.ObjectId, ref: 'Room' }
})

module.exports = model('Message', schema)