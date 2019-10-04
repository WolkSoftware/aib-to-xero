const csv = require("csv-parser");
const fs = require("fs");

function parseArgs(args) {
  const inputFile = args[2];
  const outputFile = args[3];
  return {
    inputFile,
    outputFile
  };
}

function parseCsv(filePath, cb) {
  const output = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", row => {
      const keys = Object.keys(row);
      const cleandRow = keys.reduce((prev, curr) => {
        return {
          ...prev,
          ...{
            [curr.toString().trim()]: row[[curr]]
          }
        };
      }, {});
      output.push(cleandRow);
    })
    .on("end", () => {
      cb(output);
    });
}

function generateCsv(output) {
  const outputHeaders = [
    "*Date",
    "*Amount",
    "Payee",
    "Description",
    "Reference",
    "Check Number"
  ];
  const inputHeaders = [
    "Posted Account",
    "Posted Transactions Date",
    "Description",
    "Debit Amount",
    "Credit Amount",
    "Balance",
    "Transaction Type"
  ];
  const data = output
    .map(row => {
      const date = row[inputHeaders[1]];
      const description = row[inputHeaders[2]];
      const debit = row[inputHeaders[3]];
      const credit = row[inputHeaders[4]];
      const type = row[inputHeaders[6]];
      switch (type) {
        case "Debit":
          return [date, -1 * parseFloat(debit), "", description];
        case "Credit":
          return [date, parseFloat(credit), "", description];
        default:
          return null;
      }
    })
    .filter(row => row !== null);

  return outputHeaders.join(",") + "\n" + data.map(d => d.join(",")).join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  parseCsv(args.inputFile, output => {
    const outputCsv = generateCsv(output);
    fs.writeFile(args.outputFile, outputCsv, function(err) {
      if (!err) {
        console.log("Success!");
      }
    });
  });
}

main();