const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function run() {
    for (const f of ['SME-FiberBiz-2024-01_100Mbps-3.pdf', 'SME-FiberBiz-2024-01_300Mbps-2.pdf', 'Affordaboost-500-Mbps-App-Form-2.pdf']) {
        console.log("File:", f);
        try {
            const doc = await PDFDocument.load(fs.readFileSync(f));
            const form = doc.getForm();
            const fields = form.getFields();
            console.log(fields.map(f => f.getName()));
        } catch(e) {
            console.error("No form or error:", e.message);
        }
    }
}
run();
