document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    // Verificar si el usuario está autenticado
    if (!token) {
        alert("No estás autenticado. Redirigiendo al login...");
        window.location.href = "index.html";
        return;
    }

    const query = `
    query GetUserProjects {
        projects {
            _id
            title
        }
    }
    `;

    try {
        // Realizar solicitud al servidor
        const response = await fetch("http://localhost:3000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // Añade el token
            },
            body: JSON.stringify({ query }),
        });

        // Verificar si la solicitud HTTP fue exitosa
        if (!response.ok) {
            console.error(`Error HTTP: ${response.status}`);
            alert("Error al cargar los proyectos. Por favor, intenta más tarde.");
            return;
        }

        const result = await response.json();

        // Verificar si hubo errores en la respuesta GraphQL
        if (result.errors) {
            console.error("Errores de GraphQL:", result.errors);
            alert("Error al cargar los proyectos.");
            return;
        }

        const projects = result.data.projects;

        // Renderizar proyectos en la página
        const projectsContainer = document.getElementById("projectsContainer");
        projectsContainer.innerHTML = ""; // Limpia el contenedor previo

        if (projects.length === 0) {
            projectsContainer.innerHTML = "<p>No tienes proyectos disponibles.</p>";
            return;
        }

        const list = document.createElement("ul");
        list.classList.add("list-group");

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
                    <button class="btn btn-sm btn-outline-secondary dashboard-btn" data-id="${project._id}">
                            <i class="bi bi-box-arrow-up-right"></i>
                        </button>
                </div>
            `;
            list.appendChild(listItem);
        });

        projectsContainer.appendChild(list);

        // Añadir eventos a los botones de "Ir al Dashboard"
        document.querySelectorAll(".dashboard-btn").forEach((btn) =>
            btn.addEventListener("click", async (event) => {
                const projectId = event.currentTarget.getAttribute("data-id");
                localStorage.setItem("projectId", projectId); // Guardar ID del proyecto
                window.location.href = `dashboard.html?projectId=${projectId}`;
            })
        );

        // Añadir eventos a los botones de edición
        document.querySelectorAll(".edit-btn").forEach((btn) =>
            btn.addEventListener("click", async (event) => {
                const projectId = event.currentTarget.getAttribute("data-id");
                const newTitle = prompt("Introduce el nuevo título del proyecto:");

                if (newTitle && newTitle.trim() !== "") {
                    // Enviar la solicitud de edición al servidor
                    const mutation = `
                        mutation EditProject($id: ID!, $title: String!) {
                            editProject(id: $id, title: $title) {
                                _id
                                title
                            }
                        }
                    `;

                    const variables = { id: projectId, title: newTitle };

                    try {
                        const response = await fetch("http://localhost:3000/graphql", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify({ query: mutation, variables }),
                        });

                        const result = await response.json();

                        if (result.errors) {
                            alert("Error al editar el proyecto: " + result.errors[0].message);
                        } else {
                            alert("Proyecto editado con éxito.");
                            // Actualiza la vista
                            window.location.reload();
                        }
                    } catch (error) {
                        console.error("Error al editar el proyecto:", error);
                        alert("Hubo un error al editar el proyecto.");
                    }
                }
            })
        );

        // Añadir eventos a los botones de eliminación
        document.querySelectorAll(".delete-btn").forEach((btn) =>
            btn.addEventListener("click", async (event) => {
                const projectId = event.currentTarget.getAttribute("data-id");

                const confirmation = confirm("¿Estás seguro de que deseas eliminar este proyecto?");
                if (confirmation) {
                    const mutation = `
                        mutation DeleteProject($id: ID!) {
                            deleteProject(id: $id) {
                                _id
                                title
                            }
                        }
                    `;

                    try {
                        const response = await fetch("http://localhost:3000/graphql", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify({ query: mutation, variables: { id: projectId } }),
                        });

                        const result = await response.json();

                        if (result.errors) {
                            alert("Error al eliminar el proyecto: " + result.errors[0].message);
                        } else {
                            alert("Proyecto eliminado con éxito.");
                            // Actualiza la vista
                            window.location.reload();
                        }
                    } catch (error) {
                        console.error("Error al eliminar el proyecto:", error);
                        alert("Hubo un error al eliminar el proyecto.");
                    }
                }
            })
        );

    } catch (error) {
        console.error("Connection error:", error);
        alert("Error al cargar los proyectos. Intenta más tarde.");
    }
});
