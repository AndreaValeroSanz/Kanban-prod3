document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

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
    }`;

    try {
        const response = await fetch("http://localhost:3000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            console.error(`Error HTTP: ${response.status}`);
            return;
        }

        const result = await response.json();

        if (result.errors) {
            console.error("Errores de GraphQL:", result.errors);
            alert("Error al cargar los proyectos.");
            return;
        }

        const projects = result.data.projects;

        console.log("Datos recibidos del servidor:", projects);

        const projectsContainer = document.getElementById("projectsContainer");
        if (!projectsContainer) {
            console.error("El contenedor de proyectos no existe.");
            return;
        }

        projectsContainer.innerHTML = "";

        if (projects.length === 0) {
            projectsContainer.innerHTML = "<p>No tienes proyectos disponibles.</p>";
            return;
        }

        const list = document.createElement("ul");
        list.classList.add("list-group");
        projectsContainer.appendChild(list);

        projects.forEach((project, index) => {
            setTimeout(() => {
                const listItemHTML = `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <button class="btn btn-sm btn-outline-secondary dashboard-btn" data-id="${project._id}">
                                <i class="bi bi-box-arrow-in-right"></i>
                            </button>    
                            <span class="px-2">${project.title}</span>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${project._id}">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${project._id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </li>
                `;
        
                list.insertAdjacentHTML('beforeend', listItemHTML);
        
                // Agregar eventos a los botones del nuevo elemento
                const listItem = list.lastElementChild;

                // Eventos de Dashboard
                const dashboardBtn = listItem.querySelector(".dashboard-btn");
                if (dashboardBtn) {
                    dashboardBtn.addEventListener("click", (event) => {
                        const projectId = event.currentTarget.getAttribute("data-id");
                        localStorage.setItem("projectId", projectId);
                        window.location.href = `dashboard.html?projectId=${projectId}`;
                    });
                }

                // Eventos de Edición
                const editBtn = listItem.querySelector(".edit-btn");
                if (editBtn) {
                    editBtn.addEventListener("click", async (event) => {
                        const projectId = event.currentTarget.getAttribute("data-id");
                        const newTitle = prompt("Introduce el nuevo título del proyecto:");

                        if (newTitle && newTitle.trim() !== "") {
                            const mutation = `
                            mutation EditProject($id: ID!, $title: String!) {
                                editProject(id: $id, title: $title) {
                                    _id
                                    title
                                }
                            }`;

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
                                    window.location.reload();
                                }
                            } catch (error) {
                                console.error("Error al editar el proyecto:", error);
                                alert("Hubo un error al editar el proyecto.");
                            }
                        }
                    });
                }

                // Eventos de Eliminación
                const deleteBtn = listItem.querySelector(".delete-btn");
                if (deleteBtn) {
                    deleteBtn.addEventListener("click", async (event) => {
                        const projectId = event.currentTarget.getAttribute("data-id");
                        const confirmation = confirm("¿Estás seguro de que deseas eliminar este proyecto?");
                        if (confirmation) {
                            const mutation = `
                            mutation DeleteProject($id: ID!) {
                                deleteProject(id: $id) {
                                    _id
                                    title
                                }
                            }`;

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
                                    window.location.reload();
                                }
                            } catch (error) {
                                console.error("Error al eliminar el proyecto:", error);
                                alert("Hubo un error al eliminar el proyecto.");
                            }
                        }
                    });
                }
            }, index * 50); // Añade un retraso de 500 ms entre cada creación
        });

    } catch (error) {
        console.error("Connection error:", error);
    }
});
