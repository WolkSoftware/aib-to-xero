#!/usr/bin/env node

const arg = require("arg");
const csv = require("csv-parser");
const fs = require("fs");
const { promisify } = require("util");
const moment = require("moment");

/**
 * @param {string[]} rawArgs The command line raw arguments
 * @returns {{ since: string|undefined, inputFile: string, outputFile: string}}
 */
function parseArgs(rawArgs) {
  const options = {
    since: "--since"
  };
  const aliases = {
    [options.since]: "-s"
  };
  const args = arg(
    {
      [options.since]: String,
      [aliases[options.since]]: options.since
    },
    {
      argv: rawArgs.slice(2)
    }
  );
  /** @type {string|undefined} */
  const since = args[options.since];
  const inputFile = args["_"][0];
  const outputFile = args["_"][1];
  return {
    since,
    inputFile,
    outputFile
  };
}

/**
 * @param {string} [filePath] - The csv file path
 * @returns {Promise<{}[]>}
 */
async function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    /** @type {{}[]}*/
    const output = [];
    if (filePath) {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", row => {
          const keys = Object.keys(row);
          const cleandRow = keys.reduce((prev, curr) => {
            return {
              ...prev,
              ...{
                [curr.toString().trim()]: row[curr]
              }
            };
          }, {});
          output.push(cleandRow);
        })
        .on("error", (/** @type {Error} */ err) => {
          reject(err);
        })
        .on("end", () => {
          resolve(output);
        });
    } else {
      reject(new Error("Missing input path!"));
    }
  });
}

/**
 * @param {any[]} inputContent The content of the input csv file
 * @param {string|undefined} since The date to be used as the start of the feed
 * @returns {string}
 */
function generateCsv(inputContent, since) {
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
  const dateFormat = "DD/MM/YY";
  const data = inputContent
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
    .filter(row => row !== null)
    .map(r => {
      if (r) {
        const date = moment(r[0], dateFormat);
        const amount = r[1];
        const payee = r[2];
        const description = r[3];
        return [date, amount, payee, description];
      }
    })
    .filter(r => {
      if (since && r) {
        const sinceDate = moment(since, dateFormat);
        const date = r[0];
        return sinceDate.isBefore(date);
      } else {
        return true;
      }
    })
    .map(r => (r ? [r[0].format(dateFormat), r[1], r[2], r[3]] : null));
  return (
    outputHeaders.join(",") +
    "\n" +
    data.map(d => (d ? d.join(",") : "")).join("\n")
  );
}

/**
 * @param {string} [path] The path of the output file
 * @param {string} [outputCsv] The csv content
 * @returns {Promise<void>}
 */
async function save(path, outputCsv) {
  if (path) {
    const writeFileAsync = promisify(fs.writeFile);
    try {
      return await writeFileAsync(path, outputCsv);
      console.log("Success!");
    } catch (err) {
      return Promise.reject(new Error("Missing output path!"));
    }
  } else {
    return Promise.reject(new Error("Missing output path!"));
  }
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const args = parseArgs(process.argv);
    const inputContent = await parseCsv(args.inputFile);
    const outputCsv = generateCsv(inputContent, args.since);
    await save(args.outputFile, outputCsv);
    console.log("Success!");
  } catch (err) {
    console.error(err);
  }
}

(async () => await main())();
