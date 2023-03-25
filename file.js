const fs = require("fs");

const writeInFile = async (data, type) => {
  if (type === "success") {
    fs.writeFile("output/data.json", JSON.stringify(data), (err) => {
      if (err) throw err;
      console.log(`The file has been saved to data.json`);
    });
  }
  if (type === "error") {
    fs.writeFile("output/error.json", JSON.stringify(data), (err) => {
      if (err) throw err;
      console.log(`The file has been saved to error.json`);
    });
  }
};

module.exports = { writeInFile };
