document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("signinButton");
    const loginForm = document.getElementById("loginForm");

    loginButton.addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const query = `
        mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                token
                user {
                    _id
                    email
                }
            }
        }
        `;
        const variables = { email, password };

        try {
            // Realizar la solicitud
            const response = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query, variables }),
            });

            const result = await response.json();

            // Manejo de errores del servidor GraphQL
            if (result.errors) {
                alert("Error: " + result.errors[0].message);
                window.location.reload();
                return;
            }

            // Extraer el token y guardar en localStorage
            const token = result.data.login.token;
            localStorage.setItem("token", token);
            localStorage.setItem("userEmail", email);

            alert("Login successful");
        } catch (error) {
            console.error("Connection error:", error);
            alert("Connection or server error");
        }
    });
});
