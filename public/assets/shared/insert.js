// includes.js

function getDaysInMonth(month = new Date().getMonth(), year = new Date().getFullYear()) {
  return new Date(year, month + 1, 0).getDate()
}

function getLocalStamp(date) {
  return date.getFullYear().toString() + "-" + date.getMonth() + "-" + date.getDate()
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

            const dateMap = new Map()

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

                if (h < 1 || h > getDaysInMonth(first.getMonth(), first.getFullYear()) + 1) {
                  days[index].className += " dark"
                }

                dateMap.set(getLocalStamp(today), {
                  events: eventContainer,
                  day: numberContainer
                })
              }
            }

            const today = dateMap.get(getLocalStamp(new Date()))

            if (today) {
              today.events.parentElement.className += " active"
            }

            const response = await fetch('/api/calendar');

            if (!response.ok) {
              throw new Error("No calendar data found")
            }

            const data = await response.text()
            data.split("\n").forEach(value => {
              const values = value.split(";")
              const event = {
                name: values[0],
                start: values[1],
                end: values[2],
                uri: values[3]
              }
              const date = new Date(event.start * 1000)
              const day = dateMap.get(getLocalStamp(date))


              if (day) {
                const p = document.createElement("p")
                p.className = "event"
                p.innerText = ""
                const nameParts = event.name.split(": ")

                let color = "#006931"
                switch (nameParts[0]) {
                  case "Overwatch": {
                    color = "#c57a17"
                  } break;
                  case "Marvel Rivals": {
                    color = "#c78f00"
                  } break;
                  case "Super Smash Bros": {
                    color = "#b70903"
                  } break;
                  case "Rocket League": {
                    if (event.name.includes("MSSU Gold")) {
                      color = "#0065a4"
                    } else {
                      color = "#00a4a4"
                    }
                  }
                }

                p.innerText = nameParts[nameParts.length - 1]
                p.style = `background-color: ${color}`

                day.events.appendChild(p)
              }
            })



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