import mongoose from "mongoose"

// Define el esquema del usuario
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Por favor proporciona un nombre"],
    maxlength: [60, "El nombre no puede tener más de 60 caracteres"],
  },
  email: {
    type: String,
    required: [true, "Por favor proporciona un email"],
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Exporta el modelo User
export default mongoose.models.User || mongoose.model("User", UserSchema)

