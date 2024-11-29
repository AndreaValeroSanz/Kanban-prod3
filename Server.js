import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './Schemas/Schema.js';
import resolvers from './Resolvers/Resolver.js';
import { connectDB } from './config/db.js';
import { auth } from './auth.js';
import cors from 'cors';

const app = express();

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

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}${server.graphqlPath}`);
    });
};

startServer();
