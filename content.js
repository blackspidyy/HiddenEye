(async function () {
  let uniquePaths = new Set(); // To store unique paths
  let processedResources = new Set(); // To avoid reprocessing resources

  async function fetchResource(url) {
    try {
      const response = await fetch(url);
      return response.ok ? await response.text() : null;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  }

  function isValidPath(path) {
    return (
      (path.startsWith("/") || path.startsWith("./") || path.startsWith("../")) &&
      !path.includes(" ") &&
      !/[^\x20-\x7E]/.test(path) &&
      path.length > 1 &&
      path.length < 200
    );
  }

  function extractPaths(content) {
    return [...content.matchAll(/['"]((?:\/|\.\.\/|\.\/)[^'"]+)['"]/g)]
      .map((match) => match[1])
      .filter(isValidPath);
  }

  async function processResource(resource) {
    if (processedResources.has(resource)) return;
    processedResources.add(resource);

    const content = await fetchResource(resource);
    if (content) {
      const paths = extractPaths(content);
      paths.forEach((path) => uniquePaths.add(path));

      // Send incremental results to the extension popup
      chrome.runtime.sendMessage({
        action: "scanResults",
        results: Array.from(uniquePaths),
      });
    }
  }

  async function scanResources() {
    const resources = performance.getEntriesByType("resource").map((res) => res.name);
    for (const resource of resources) {
      await processResource(resource);
    }

    // Notify completion
    chrome.runtime.sendMessage({
      action: "scanComplete",
      results: Array.from(uniquePaths),
    });
  }

  scanResources();
})();