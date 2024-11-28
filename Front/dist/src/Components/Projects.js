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
                </div>
            `;
            list.appendChild(listItem);
        });

        projectsContainer.appendChild(list);

        // Añadir eventos a los botones
        document.querySelectorAll(".edit-btn").forEach((btn) =>
            btn.addEventListener("click", (event) => {
                const projectId = event.currentTarget.getAttribute("data-id");
                alert(`Editar proyecto: ${projectId}`);
            })
        );

        document.querySelectorAll(".delete-btn").forEach((btn) =>
            btn.addEventListener("click", (event) => {
                const projectId = event.currentTarget.getAttribute("data-id");
                alert(`Eliminar proyecto: ${projectId}`);
            })
        );

    } catch (error) {
        console.error("Connection error:", error);
        alert("Error al cargar los proyectos. Intenta más tarde.");
    }
});