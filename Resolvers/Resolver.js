import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Card from '../models/card.js';
import fs from 'fs';
import path from 'path';

const SECRET_KEY = "gommit";

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

    uploadAvatar: async (_, { file }, { userId }) => {
      if (!userId) throw new Error('No autorizado');

      const { createReadStream, filename } = await file;
      const uploadPath = path.join(__dirname, '../uploads', filename);

      await new Promise((resolve, reject) => {
        createReadStream()
          .pipe(fs.createWriteStream(uploadPath))
          .on('finish', resolve)
          .on('error', reject);
      });

      const avatarUrl = `http://localhost:3000/uploads/${filename}`;
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
      );

      return updatedUser;
    },
  },
};

export default resolvers;
