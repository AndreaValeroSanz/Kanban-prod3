// Add Projects
document.addEventListener("DOMContentLoaded", () => {
    const createProjectButton = document.getElementById("createProjectButton");
    const createProjectForm = document.getElementById("createProjectForm");
    const projectForm = document.getElementById("projectForm");
    const cancelButton = document.getElementById("cancelButton");

    // Mostrar el formulario al hacer clic en el botón "Crear nuevo proyecto"
    createProjectButton.addEventListener("click", () => {
        createProjectForm.style.display = "block";
    });

    // Cancelar la creación del proyecto
    cancelButton.addEventListener("click", () => {
        createProjectForm.style.display = "none";
    });

    // Enviar el formulario para crear el nuevo proyecto
    projectForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Evita que el formulario se envíe de forma tradicional

        const title = document.getElementById("projectTitle").value;

        // Asegúrate de que el usuario esté autenticado (obteniendo el token del localStorage)
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Por favor, inicia sesión primero.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`, // Incluir el token en los headers
                },
                body: JSON.stringify({
                    query: `
                        mutation CreateProject($title: String!, $userId: String!) {
                            createProject(title: $title, userId: $userId) {
                                _id
                                title
                                user_id
                            }
                        }
                    `,
                    variables: {
                        title,
                        userId: token, // Se asume que el ID de usuario está en el token
                    }
                }),
            });

            const result = await response.json();
            if (result.errors) {
                alert("Error al crear el proyecto: " + result.errors[0].message);
            } else {
                alert("Proyecto creado con éxito.");
                createProjectForm.style.display = "none"; // Ocultar el formulario después de enviar
                // Opcionalmente, podrías actualizar la lista de proyectos aquí
            }
        } catch (error) {
            console.error("Error al crear el proyecto:", error);
            alert("Hubo un error al crear el proyecto. Intenta nuevamente.");
        }
    });
});

// Delete Projects


// Edit Projects

