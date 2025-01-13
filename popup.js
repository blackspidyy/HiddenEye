const spinner = document.getElementById("spinner");
const resultList = document.getElementById("resultList");
const resultsContainer = document.getElementById("results");
const copyButton = document.getElementById("copyButton");

// A set to track unique scan results
let scanResults = new Set();

// Start scanning immediately when the popup opens
function startScan() {
  resultList.innerHTML = ""; // Clear previous results
  resultsContainer.style.display = "none"; // Hide results initially
  spinner.style.display = "block"; // Show spinner

  // Send script to active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["content.js"], // Ensure this file exists and sends messages
    });
  });
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "scanResults") {
    // Add new results incrementally
    message.results.forEach((path) => {
      if (!scanResults.has(path)) {
        scanResults.add(path);
        const listItem = document.createElement("li");
        listItem.textContent = path; // Append result as a continuous entry
        resultList.appendChild(listItem);
      }
    });

    // Show the results container
    resultsContainer.style.display = "block";
  } else if (message.action === "scanComplete") {
    // Hide spinner when scanning is complete
    spinner.style.display = "none";
  }
});

// Copy all results to clipboard
copyButton.addEventListener("click", () => {
  const allResults = Array.from(scanResults).join("\n");
  navigator.clipboard.writeText(allResults); // Copy results silently
});

// Trigger scan on popup load
window.onload = startScan;