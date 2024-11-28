import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const SECRET_KEY = 'gommit';
const resolvers = {
  Query: {
    getAllCards: async (_, __, { userId }) => {
      if (!userId) throw new Error('No autorizado');
      return await Card.find({ user_id: userId });
    },
  },
  Mutation: {
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('Usuario no encontrado');

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new Error('Contraseña incorrecta');

      const token = jwt.sign({ userId: user._id, email: user.email }, SECRET_KEY, { expiresIn: '3h' });
      return { token, user };
    },
    createCard: async (_, { title, description, duedate, type, color, projects_id }, { userId }) => {
      if (!userId) throw new Error('No autorizado');

      const newCard = new Card({
        title,
        description,
        duedate,
        type,
        color,
        user_id: userId,
        projects_id,
      });

      return await newCard.save();
    },
    deleteCard: async (_, { id }, { userId }) => {
      if (!userId) throw new Error('No autorizado');
      return await Card.findOneAndDelete({ _id: id, user_id: userId });
    },
    editCard: async (_, { id, title, description, duedate, color }, { userId }) => {
      if (!userId) throw new Error('No autorizado');

      return await Card.findByIdAndUpdate(
        id,
        { title, description, duedate, color },
        { new: true }
      );
    },
    updateCardType: async (_, { id, type }, { userId }) => {
      if (!userId) throw new Error('No autorizado');

      const card = await Card.findOne({ _id: id, user_id: userId });
      if (!card) throw new Error('Tarjeta no encontrada o no autorizada');

      card.type = type;
      return await card.save();
    },
  },
};

export default resolvers;
