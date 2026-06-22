import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function test() {
    try {
        const buffer = fs.readFileSync('cancer_patient_data.csv'); // just to check if it's there
        console.log("File read ok");
    } catch(e) {}
}
test();
