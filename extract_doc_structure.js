const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\user\\.gemini\\tmp\\6e3a9367f0a67a2ff93f3ca0a8ac602272984e320af1b88c9ea89129331d2ab4\\doc_content\\word\\document.xml';

try {
    const xml = fs.readFileSync(filePath, 'utf8');

    // Helper to get text from a paragraph string
    const getParagraphText = (pXml) => {
        const textMatches = pXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        if (!textMatches) return "";
        return textMatches.map(t => t.replace(/<w:t[^>]*>/, '').replace('<\/w:t>', '')).join('');
    };

    // Helper to check if paragraph has bold number ending with )
    // This is approximate as formatting can be split across runs
    // We look for a run with <w:b/> that contains the number pattern
    const isBoldNumbered = (pXml) => {
        // Regex to find a run that is bold and has text
        // <w:r> ... <w:rPr> ... <w:b/> ... </w:rPr> ... <w:t>text</w:t> ... </w:r>
        
        // Simplified check: Does it contain <w:b/> or <w:b w:val="1"/>?
        const hasBold = /<w:b(?:\s|\/|>)/.test(pXml);
        if (!hasBold) return false;

        const text = getParagraphText(pXml).trim();
        // Check pattern: "1 )", "1)", "12 )" etc.
        // The previous extraction showed spaces like "1 )"
        return /^[\d\s]+\)/.test(text);
    };

    const paragraphs = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
    
    let currentSection = null;
    const sections = [];

    paragraphs.forEach(p => {
        const text = getParagraphText(p).trim();
        if (!text) return;

        if (isBoldNumbered(p)) {
            // Found a new section
            currentSection = {
                title: text,
                content: []
            };
            sections.push(currentSection);
        } else if (currentSection) {
            currentSection.content.push(text);
        }
    });

    console.log(JSON.stringify(sections, null, 2));

} catch (e) {
    console.error(e);
}
