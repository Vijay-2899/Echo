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