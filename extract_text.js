const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\user\\.gemini\\tmp\\6e3a9367f0a67a2ff93f3ca0a8ac602272984e320af1b88c9ea89129331d2ab4\\doc_content\\word\\document.xml';

try {
    const xml = fs.readFileSync(filePath, 'utf8');
    
    // Very simple regex based extraction for <w:t> content
    // This handles the basic text runs in Word XML
    const textMatches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    
    if (textMatches) {
        const text = textMatches.map(tag => {
            return tag.replace(/<w:t[^>]*>/, '').replace('</w:t>', '');
        }).join(' ');
        
        console.log(text);
    } else {
        console.log("No text found.");
    }

} catch (e) {
    console.error(e);
}
