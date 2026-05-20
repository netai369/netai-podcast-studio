import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Load the PDF.js worker from the local server instead of CDN
// The worker file is served from the public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

async function parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ');
        textContent += '\n';
    }
    return textContent;
}

async function parseDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function parseOdt(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const contentXml = await zip.file('content.xml')?.async('string');
    if (!contentXml) throw new Error('content.xml not found in ODT file.');
    // Basic XML tag stripping. A more robust solution might use a DOM parser.
    return contentXml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const parseDocument = async (file: File): Promise<{ name: string, content: string }> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    let content = '';
    
    try {
        switch (extension) {
            case 'txt':
                content = await file.text();
                break;
            case 'pdf':
                content = await parsePdf(file);
                break;
            case 'docx':
                content = await parseDocx(file);
                break;
            case 'odt':
                content = await parseOdt(file);
                break;
            default:
                if (file.type.startsWith('text/')) {
                    content = await file.text();
                    break;
                }
                throw new Error(`Unsupported file type: .${extension}. Please upload .txt, .pdf, .docx, or .odt files.`);
        }
    } catch (err) {
         throw new Error(`Failed to parse ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    return { name: file.name, content };
};
