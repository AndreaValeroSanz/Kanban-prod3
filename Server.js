import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './Schemas/Schema.js';
import resolvers from './Resolvers/Resolver.js';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { auth } from './auth.js';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

const app = express();
const httpServer = createServer(app); // Crear servidor HTTP para trabajar con Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Cambia esto según tu configuración
    methods: ['GET', 'POST'],
  },
});

const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      try {
        auth(req, null, () => {});
        return { userId: req.userId };
      } catch (err) {
        console.error('Error de autenticación:', err.message);
        throw new Error('No autorizado');
      }
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  connectDB();

  // Manejar subida de archivos con Socket.IO
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('upload_avatar', (data, callback) => {
      const { userId, fileName, fileContent } = data;

      if (!userId) {
        callback({ success: false, message: 'Usuario no autorizado' });
        return;
      }

      const uploadPath = path.join(__dirname, 'uploads', fileName);

      // Guardar archivo como imagen
      fs.writeFile(uploadPath, fileContent, 'base64', async (err) => {
        if (err) {
          console.error('Error al guardar el archivo:', err);
          callback({ success: false, message: 'Error al guardar el archivo' });
        } else {
          console.log('Archivo guardado en:', uploadPath);

          // Actualizar avatar del usuario
          const avatarUrl = `http://localhost:3000/uploads/${fileName}`;
          await mongoose.model('User').findByIdAndUpdate(userId, { avatar: avatarUrl });

          callback({ success: true, message: 'Avatar subido correctamente', avatarUrl });
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  // Servir archivos estáticos
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Socket.IO corriendo en http://localhost:${PORT}`);
  });
};

startServer();
