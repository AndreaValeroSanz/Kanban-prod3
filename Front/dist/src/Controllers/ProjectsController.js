document.addEventListener("DOMContentLoaded", async () => {
    const createProjectButton = document.getElementById("createProjectButton");
    const createProjectForm = document.getElementById("createProjectForm");
    const projectForm = document.getElementById("projectForm");
    const editProjectForm = document.getElementById("editProjectForm");
    const projectTitleInput = document.getElementById("editProjectTitle");
    const projectsContainer = document.getElementById("projectsContainer");
    const cancelButton = document.getElementById("cancelButton");
    const cancelEditButton = document.getElementById("cancelEditButton");
    const cardsContainer = document.getElementById("cardsContainer");

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
                            getAllProjects {
                                _id
                                title
                                user_id
                            }
                        }
                    `,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.errors) {
                console.error("Error al obtener los proyectos:", result.errors[0].message);
                return [];
            }

            return result.data.getAllProjects; // Devuelve los proyectos obtenidos
        } catch (error) {
            console.error("Error al obtener los proyectos:", error);
            return [];
        }
    };

    // Función para renderizar los proyectos en el contenedor
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

    // Recargar la lista de proyectos al cargar la página
    const projects = await fetchProjects(); // Llamada a fetchProjects
    renderProjects(projects); // Renderizar proyectos obtenidos

    let currentEditProjectId = null; // Variable para guardar el ID del proyecto que se está editando

    // Inicialmente ocultar los formularios
    createProjectForm.style.display = "none";
    editProjectForm.style.display = "none";

    // Mostrar el formulario al hacer clic en el botón "Crear nuevo proyecto"
    createProjectButton.addEventListener("click", () => {
        createProjectForm.style.display = "block";
    });

    // Cancelar la creación del proyecto
    cancelButton.addEventListener("click", () => {
        createProjectForm.style.display = "none";
    });

    // Enviar el formulario para crear un nuevo proyecto
    projectForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Evitar el envío tradicional del formulario

        // Obtener el título del formulario
        const title = document.getElementById("projectTitle").value;

        // Obtener el token del localStorage
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Por favor, inicia sesión primero.");
            return;
        }

        // Decodificar el token para extraer el userId
        let userId;
        try {
            const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decodificar el payload del token JWT
            userId = decodedToken.userId;
        } catch (error) {
            console.error("Error al decodificar el token:", error);
            alert("Token inválido. Por favor, inicia sesión nuevamente.");
            return;
        }

        // Realizar la solicitud para crear el proyecto
        try {
            const response = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`, // Enviar el token en los headers
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
                    variables: { title, userId }, // Enviar título y userId
                }),
            });

            const result = await response.json();
            if (result.errors) {
                alert("Error al crear el proyecto: " + result.errors[0].message);
            } else {
                alert("Proyecto creado con éxito.");
                createProjectForm.style.display = "none"; // Ocultar el formulario después de enviar
                document.getElementById("projectTitle").value = ""; // Limpiar el campo del formulario

                // Recargar la lista de proyectos
                const projects = await fetchProjects();
                renderProjects(projects);
            }
        } catch (error) {
            console.error("Error al crear el proyecto:", error);
            alert("Hubo un error al crear el proyecto. Intenta nuevamente.");
        }
    });
});
