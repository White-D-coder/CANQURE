import Tesseract from 'tesseract.js';
import fs from 'fs';

async function test() {
    try {
        const dummyBuffer = fs.readFileSync('test.png');
        console.log("Buffer length:", dummyBuffer.length);
        const result = await Tesseract.recognize(dummyBuffer, 'eng');
        console.log("Success:", result.data.text);
    } catch (err) {
        console.error("OCR Error test:", err);
    }
}
test();
