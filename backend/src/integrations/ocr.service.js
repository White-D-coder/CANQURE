import Tesseract from 'tesseract.js';
import { createRequire } from 'module';
import { google } from 'googleapis';
import fs from 'fs';
import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// --- GOOGLE DRIVE CONFIGURATION ---
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
    keyFile: './config/service_account_key.json', // Path to your service account key
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

export const uploadToDrive = async (filePath, fileName) => {
    try {
        const fileMetadata = {
            name: fileName,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], 
        };
        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath),
        };
        const res = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });
        return res.data.webViewLink;
    } catch (error) {
        console.error("Google Drive Upload Error:", error);
        return null;
    }
};

export const extractTextFromImage = async (imageBuffer) => {
    try {
        console.log("Starting OCR processing...");
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
        console.log("OCR complete.");
        return text;
    } catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Failed to extract text from image");
    }
};

export const extractTextFromPdf = async (pdfBuffer) => {
    try {
        console.log("Starting PDF text extraction...");
        const data = await pdfParse(pdfBuffer);
        console.log("PDF extraction complete.");
        return data.text;
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        throw new Error("Failed to extract text from PDF");
    }
};

let ai = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
    try {
        ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e.message);
    }
}

export const parseMedicines = async (text) => {
    if (!ai) {
        console.warn("Google AI not initialized (missing or invalid GEMINI_API_KEY). Extraction disabled.");
        return [];
    }

    const genModel = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a clinical prescription intelligence engine.
Extract only explicitly written data. If unclear, return "UNKNOWN".
Output valid JSON only.

Return JSON exactly in this format:
{
  "patient_info": {},
  "clinical_information": {},
  "medicines": [
    {
      "brand_name_as_written": "",
      "generic_name_if_written": "",
      "strength_value": "",
      "strength_unit": "",
      "dosage_form": "",
      "frequency_exact_text": "",
      "timing_exact_text": "",
      "duration_exact_text": "",
      "total_quantity_if_written": ""
    }
  ],
  "lab_tests": [],
  "followup_notes": "",
  "data_completeness": "HIGH/MEDIUM/LOW",
  "requires_manual_review": false,
  "validation_notes": []
}

Report Text:
${text}`;

    try {
        const result = await genModel.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        
        // Clean up response text if it contains markdown code blocks
        const cleanedText = responseText.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanedText);

        if (parsedData && Array.isArray(parsedData.medicines)) {
            return parsedData.medicines.map((med, index) => {
                const name = med.brand_name_as_written || med.generic_name_if_written || "Unknown Medicine";
                const strength = (med.strength_value && med.strength_value !== "UNKNOWN") ? med.strength_value : "";
                const unit = (med.strength_unit && med.strength_unit !== "UNKNOWN") ? med.strength_unit : "";
                const dosage = `${strength} ${unit}`.trim() || "As prescribed";
                const timing = (med.timing_exact_text && med.timing_exact_text !== "UNKNOWN") ? med.timing_exact_text :
                    ((med.frequency_exact_text && med.frequency_exact_text !== "UNKNOWN") ? med.frequency_exact_text : "Daily");

                return {
                    id: index,
                    name: name,
                    originalText: `${name} ${dosage} ${med.dosage_form || ''} ${timing}`.trim(),
                    timing: timing,
                    dosage: dosage
                };
            });
        }
        return [];
    } catch (error) {
        console.error("AI Parsing Error:", error);
        return [];
    }
};
