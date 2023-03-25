const fs = require("fs");
fs.readFile("./output/data.json", "utf8", (err, jsonString) => {
  if (err) {
    console.log("Error reading file from disk:", err);
    return;
  }
  try {
    const data = JSON.parse(jsonString);
    data.items.forEach((item) => {
      if (item.name === "spotifydiscover") {
        console.log(item);
      } else {
        console.log("No Discover Weekly found");
      }
    });
  } catch (err) {
    console.log("Error parsing JSON string:", err);
  }
});
