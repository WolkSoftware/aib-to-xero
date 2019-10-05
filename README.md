# aib-to-xero

Transforms Allied Irish Banks (AIB) a bank statement (.csv) into a Xero bank feed (.csv).

1. Install **aib-to-xero** with `npm install -g aib-to-xero`

2. Export your AIB bank feed to .csv

3. Convert the AIB csv into a Xero csv with:

   ```sh
   aib-to-xero input_file_name.csv output_file_name.csv
   ```

   It is also possible to ignore all entries prior to a date using the `--since` or `-s` flag:

   ```sh
   aib-to-xero -s 30/09/19 input_file_name.csv output_file_name.csv
   ```

4. Upload the output file to the Xero bank feed import tool.
