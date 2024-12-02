document.addEventListener("DOMContentLoaded", () => {
    // Obtener los elementos del DOM
    const createProjectButton = document.getElementById("createProjectButton");
    const createProjectForm = document.getElementById("createProjectForm");
    const projectForm = document.getElementById("projectForm");
    const editProjectForm = document.getElementById("editProjectForm");
    const projectTitleInput = document.getElementById("editProjectTitle");
    const projectsContainer = document.getElementById("projectsContainer");
    const cancelButton = document.getElementById("cancelButton");
    const cancelEditButton = document.getElementById("cancelEditButton");

    // Configuración de scroll para projectsContainer
    projectsContainer.style.maxHeight = "400px"; // Ajusta la altura máxima del contenedor
    projectsContainer.style.overflowY = "auto"; // Habilita el scroll vertical

    // Función para obtener los proyectos
    const fetchProjects = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No se encontró un token válido. Por favor, inicia sesión.");
            return [];
        }

        try {
            const response = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        query {
                            projects {
                                _id
                                title
                                user_id
                            }
                        }
                    `,
                }),
            });

            if (!response.ok) {
                const errorResponse = await response.text(); // Obtener el cuerpo de la respuesta en caso de error
                console.error(`Error HTTP: ${response.status}. Detalles: ${errorResponse}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.errors) {
                console.error("Error al obtener los proyectos:", result.errors[0].message);
                return [];
            }

            return result.data.projects;
        } catch (error) {
            console.error("Error al obtener los proyectos:", error);
            return [];
        }
    };

    // Función para renderizar los proyectos
    const renderProjects = (projects) => {
        projectsContainer.innerHTML = ""; // Limpiar el contenedor
        projects.forEach((project) => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            listItem.innerHTML = `
                <span>${project.title}</span>
                <div>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${project._id}">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${project._id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            projectsContainer.appendChild(listItem);
        });
    };

    // Cargar y renderizar los proyectos al inicio
    const loadAndRenderProjects = async () => {
        const projects = await fetchProjects();
        renderProjects(projects);
    };

    loadAndRenderProjects(); // Cargar proyectos al cargar la página

    // Mostrar el formulario de creación de proyecto
    createProjectButton.addEventListener("click", () => {
        createProjectForm.style.display = "block";
    });

    // Ocultar el formulario de creación de proyecto
    cancelButton.addEventListener("click", () => {
        createProjectForm.style.display = "none";
    });

    // Enviar el formulario para crear un nuevo proyecto
    projectForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Evitar el envío tradicional del formulario

        const title = document.getElementById("projectTitle").value;
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Por favor, inicia sesión primero.");
            return;
        }

        let userId;
        try {
            const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decodificar el token
            userId = decodedToken.userId; // Obtener el userId del token
        } catch (error) {
            console.error("Error al decodificar el token:", error);
            alert("Token inválido. Por favor, inicia sesión nuevamente.");
            return;
        }

        try {
            // Realizar la mutación para crear un nuevo proyecto
            const response = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
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
                    variables: { title, userId }, // Enviar título y userId como variables
                }),
            });

            if (!response.ok) {
                const errorResponse = await response.text(); // Obtener el cuerpo de la respuesta en caso de error
                console.error(`Error HTTP: ${response.status}. Detalles: ${errorResponse}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.errors) {
                console.error("Error al crear el proyecto:", result.errors[0].message);
                alert("Error al crear el proyecto.");
                return;
            }

            alert("Proyecto creado con éxito.");

            // Limpiar el formulario
            createProjectForm.style.display = "none";
            document.getElementById("projectTitle").value = "";

            // Recargar la lista de proyectos
            await loadAndRenderProjects();
        } catch (error) {
            console.error("Error al crear el proyecto:", error);
            alert("Hubo un error al crear el proyecto. Intenta nuevamente.");
        }
    });
});
