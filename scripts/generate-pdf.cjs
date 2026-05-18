const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ 
        headless: 'new',
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const htmlPath = path.resolve(__dirname, '..', 'docs', 'documentation.html');
    const pdfPath = path.resolve(__dirname, '..', 'docs', 'AtomQuest-Documentation.pdf');

    console.log('Loading HTML...');
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });

    // Wait for Mermaid to render
    console.log('Waiting for Mermaid diagram to render...');
    await page.waitForSelector('svg[id^="mermaid"]', { timeout: 30000 }).catch(() => {
        console.log('Mermaid SVG not found, continuing anyway...');
    });
    
    // Extra wait for rendering to complete
    await new Promise(r => setTimeout(r, 3000));

    console.log('Generating PDF...');
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: '<div style="font-size:9px; text-align:center; width:100%; color:#888;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    });

    await browser.close();
    console.log(`PDF saved to: ${pdfPath}`);
})();
