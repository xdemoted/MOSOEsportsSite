// includes.js
 
// Function to load HTML content into a target element
async function loadHTML(elementId, filePath) {
  try {
    // Fetch the external HTML file
    const response = await fetch(filePath);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
    }
    
    // Extract HTML text from the response
    const html = await response.text();
    
    // Insert the HTML into the target element
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
      if (elementId === 'header') {
        const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
        element.querySelectorAll('#navbar a').forEach(link => {
          const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/+$/, '') || '/';
          link.classList.toggle('active', linkPath === currentPath);
        });

        const loginButton = element.querySelector('.account');
        loginButton?.addEventListener('click', async () => {
          try {
            const response = await fetch('/api/auth/redirect');
            if (!response.ok) {
              throw new Error(`Login request failed: ${response.status}`);
            }

            const redirectUrl = await response.text();
            if (!redirectUrl) {
              throw new Error('Login redirect URL was empty');
            }

            window.location.assign(redirectUrl);
          } catch (error) {
            console.error('Unable to start login:', error);
          }
        });
      }
    } else {
      throw new Error(`Element with ID "${elementId}" not found`);
    }
  } catch (error) {
    console.error('Error loading content:', error);
  }
}
 
// Load header and footer when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  loadHTML('header', 'shared/header.html'); // Load header into #header
  loadHTML('footer', 'shared/footer.html'); // Load footer into #footer
});