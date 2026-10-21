// includes.js

function getDaysInMonth(month, year) {
  month = month ? month : new Date().getMonth()
  year = year ? year : new Date().getFullYear()

  return new Date(year, month, 0).getDate()
}
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
      switch (elementId) {
        case "header": {
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
        } break;
        case "calendar": {
          const loadpage = document.getElementById("loadpage")

          if (loadpage) {
            const spin = loadpage.children[0];
            let deg = 0

            const interval = setInterval(() => {
              spin.style.transform = `rotate(${deg}deg)`
              deg += 7
              deg = (deg > 360) ? deg - 360 : deg
            }, 25)

            const days = element.querySelectorAll(".day")

            const first = new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            )

            first.getDay()

            let h = -first.getDay()

            for (let i = 0; i < 5; i++) {
              for (let j = 0; j < 7; j++) {
                const index = j * 5 + i
                const today = new Date(first)
                today.setDate(first.getDate() + h++)

                const numberContainer = document.createElement("div")
                numberContainer.className = "number"
                numberContainer.innerText = today.getDate()
                days[index].appendChild(numberContainer)

                const eventContainer = document.createElement("div")
                eventContainer.className = "events"
                days[index].appendChild(eventContainer)
                if (h < 1 || h > getDaysInMonth() + 1) {
                  days[index].className += " dark"
                }
              }

            }

            const response = await fetch('/api/calendar');

            if (!response.ok) {
              throw new Error("No calendar data found")
            }

            const data = await response.text()

            clearInterval(interval)
            loadpage.remove()


          }
        }
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
  loadHTML('calendar', 'shared/calendar.html'); // Load insert into #calendar
});