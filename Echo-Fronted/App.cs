*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}


body, html, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevent scrolling on body, manage scroll on inner components */
}

.container {
  display: flex;
  flex-direction: column; /* Stack header, room control, and main content vertically */
  height: 100vh; /* Full viewport height */
  max-width: 800px; /* Adjusted max width for simpler layout */
  margin: 0 auto; /* Center the container horizontally */
  background-color: var(--mui-palette-background-default); /* Use theme background */
  font-family: var(--mui-typography-font-family); /* Use theme font */
  box-shadow: 0 4px 20px rgba(0,0,0,0.05); /* Subtle shadow for the entire app container */
  border-radius: 8px; /* Consistent rounded corners for the app container */
  overflow: hidden; /* Ensure no overflow outside rounded corners */
}

.room-control {
  display: flex;
  flex-direction: column; /* Stack items vertically within room control */
  gap: 15px; /* Spacing between sections of inputs/buttons */
  padding: 20px;
  background-color: var(--mui-palette-background-paper);
  border-bottom: 1px solid var(--mui-palette-divider); /* Subtle separator */
  box-shadow: 0 2px 4px rgba(0,0,0,0.02); /* Very subtle shadow */
  align-items: center; /* Center content horizontally */
  justify-content: center; /* Center content vertically */
}

.room-control > .MuiBox-root { /* Styling for the inner Box components within room-control */
    width: 100%; /* Ensure inner boxes take full width for centering content */
    display: flex;
    justify-content: center; /* Center items within these inner boxes */
    flex-wrap: wrap; /* Allow wrapping for responsiveness */
    gap: 15px; /* Spacing between individual form elements */
}

#room-feedback {
  width: 100%; /* Take full width for feedback message */
  text-align: center;
  font-size: 0.9rem;
  color: var(--mui-palette-text-secondary);
  margin-top: 5px;
}

.chat-screen {
  flex-grow: 1; /* Make chat screen take all available vertical space */
  display: flex;
  flex-direction: column; /* Stack messages and input vertically */
  background-color: var(--mui-palette-background-default); /* Background for the chat area */
}

.chat-screen h6 { /* Styling for "Chat Screen" title */
  padding: 15px 20px;
  border-bottom: 1px solid var(--mui-palette-divider);
  color: var(--mui-palette-text-primary);
  background-color: var(--mui-palette-background-paper); /* Header-like background */
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}