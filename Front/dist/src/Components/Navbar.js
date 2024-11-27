class Navbar extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEventHandlers();
  }

  render() {
    const userEmail = localStorage.getItem("userEmail");

    this.innerHTML = `
          ${
            userEmail 
              ? `<div class="d-flex align-items-center">
                  <span class="navbar-text me-2">${userEmail}</span>
                  <button id="logoutButton" class="btn btn-outline-secondary btn-sm" title="Logout">
                    <i class="bi bi-box-arrow-right"></i>
                  </button>
                 </div>`
              : `<button 
                  type="button" 
                  class="btn btn-primary d-flex align-items-center" 
                  data-bs-toggle="modal" 
                  data-bs-target="#loginModal" 
                  data-bs-whatever="email">
                  Login
                 </button>`
          }
        </div>
      </nav>
    `;
  }

  attachEventHandlers() {
    const loginForm = this.querySelector("#loginForm");
    if (loginForm) loginForm.addEventListener("submit", this.handleLogin.bind(this));

    const logoutButton = this.querySelector("#logoutButton");
    if (logoutButton) logoutButton.addEventListener("click", this.handleLogout.bind(this));
  }

  async handleLogin(event) {
    event.preventDefault();

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
      const response = await fetch("http://localhost:3000/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });

      const result = await response.json();

      if (result.errors) {
        alert("Error: " + result.errors[0].message);
        return;
      }

      const token = result.data.login.token;
      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", email);

      alert("Login successful");

      const modal = bootstrap.Modal.getInstance(document.getElementById("loginModal"));
      modal.hide();

      this.render(); // Re-render to show the email and logout button

      // Refresh the page to reset the navbar and state
      window.location.reload();
    } catch (error) {
      console.error("Connection error:", error);
      alert("Connection or server error");
    }
  }

  handleLogout() {
    // Remove token and user email from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");

    // Refresh the page to reset the navbar and state
    window.location.reload();
  }
}

customElements.define("my-navbar", Navbar);
