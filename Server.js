import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './Schemas/Schema.js';
import resolvers from './Resolvers/Resolver.js';
import { connectDB } from './config/db.js';
import { auth } from './auth.js';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import User from './models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

// Conectar a la base de datos solo una vez aquí
connectDB();

app.use(cors('http://localhost:3000'));  // Configuración de CORS

const startServer = async () => {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            const token = req.headers.authorization || '';
            try {
                // Llama al middleware de autenticación
                auth(req, null, () => {});

                // Retorna el contexto con `userId` solo si la autenticación es exitosa
                return { userId: req.userId };
            } catch (err) {
                console.error("Error de autenticación:", err.message);
                throw new Error("No autorizado");
            }
        },
    });

  await server.start();
  server.applyMiddleware({ app });

  connectDB();

  // Ensure the 'public/avatars' directory exists
  const uploadDir = path.join(__dirname, 'front', 'dist', 'public', 'avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve static files from 'public/avatars'
  app.use('/avatars', express.static(uploadDir));

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('upload_avatar', async (data, callback) => {
      const { userId, fileName, fileContent } = data;

      if (!userId) {
        callback({ success: false, message: 'Usuario no autenticado' });
        return;
      }

      const uploadPath = path.join(uploadDir, fileName);

      // Save the file
      fs.writeFile(uploadPath, fileContent, 'base64', async (err) => {
        if (err) {
          console.error('Error al guardar el archivo:', err);
          callback({ success: false, message: 'Error al guardar el archivo' });
        } else {
          console.log('Archivo guardado en:', uploadPath);

          // Update the user's avatar in the database
          const avatarUrl = `/public/avatars/${fileName}`;
          await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

          callback({ success: true, message: 'Avatar subido correctamente', avatarUrl });
          
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Socket.IO corriendo en http://localhost:${PORT}`);
  });
};

startServer();
