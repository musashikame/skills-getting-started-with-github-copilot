document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list with delete buttons
        const participantsHtml = details.participants.length > 0
          ? details.participants.map(participant =>
              `<li><span class="participant-email">${participant}</span><button class="delete-participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(participant)}" title="Unregister">✖</button></li>`
            ).join('')
          : '<li style="color: #999; font-style: italic;">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants (${details.participants.length})</strong>
            <ul>
              ${participantsHtml}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so participant list updates
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Event delegation for delete buttons
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-participant');
    if (!btn) return;

    const activity = decodeURIComponent(btn.getAttribute('data-activity'));
    const email = decodeURIComponent(btn.getAttribute('data-email'));

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        // Remove the list item from the DOM
        const li = btn.closest('li');
        if (li) li.remove();
        messageDiv.textContent = result.message;
        messageDiv.className = 'success';
        messageDiv.classList.remove('hidden');
        // Refresh activities to update counts
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister participant';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
      }
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    } catch (err) {
      console.error('Unregister error', err);
      messageDiv.textContent = 'Failed to unregister. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
