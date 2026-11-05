/**
 * EU 符合性声明 PDF（Annex VI Part B，demo 简化）
 *
 * 用 pdfkit 现场生成，英文输出（Helvetica 内置字体不支持中文；
 * 正式 DoC 的语言要求按目标成员国规定，这里演示用 EN）。
 * 页面带 DEMO 水印说明，防止被当成真实文件使用。
 */
import PDFDocument from 'pdfkit';

function line(doc, label, value, x, y, width) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748B').text(label.toUpperCase(), x, y);
  doc.font('Helvetica').fontSize(11).fillColor('#0F172A').text(value || '—', x, y + 13, { width: width - 20 });
  return y + 44;
}

export function buildDocPdf({ model, tenant, doc, url }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const pdf = new PDFDocument({ size: 'A4', margin: 56, info: { Title: `EU DoC ${doc.docNo}` } });
    pdf.on('data', (c) => chunks.push(c));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    const W = pdf.page.width - 112;

    // 标题
    pdf.font('Helvetica-Bold').fontSize(17).fillColor('#0F172A')
      .text('EU DECLARATION OF CONFORMITY', { align: 'center' });
    pdf.font('Helvetica').fontSize(9).fillColor('#94A3B8')
      .text('(sample document generated for demonstration only)', { align: 'center' });
    pdf.moveDown(0.4);
    pdf.moveTo(56, pdf.y).lineTo(pdf.page.width - 56, pdf.y).lineWidth(1).strokeColor('#E2E8F0').stroke();
    pdf.moveDown(1.2);

    let y = pdf.y;
    y = line(pdf, 'Declaration / DoC number', doc.docNo, 56, y, W);
    y = line(pdf, 'Date of issue', doc.issuedAt || '—', 56, y, W);
    y = line(pdf, 'Product / battery model', `${model.modelName} (${model.modelCode})`, 56, y, W);
    y = line(pdf, 'Battery category', model.category, 56, y, W);
    y = line(pdf, 'Chemistry · rated voltage · rated capacity',
      `${model.chemistry} · ${model.ratedVoltage || '—'} · ${model.ratedCapacity || '—'}`, 56, y, W);
    y = line(pdf, 'Manufacturer', tenant.companyName, 56, y, W);
    y = line(pdf, 'Registered trademark', tenant.trademark || '—', 56, y, W);
    y = line(pdf, 'Address', tenant.registeredAddress || '—', 56, y, W);
    y = line(pdf, 'Contact', tenant.contactPhone || '—', 56, y, W);

    // 声明正文
    pdf.font('Helvetica').fontSize(10).fillColor('#334155').text(
      'This declaration of conformity is issued under the sole responsibility of the manufacturer. ' +
        'The product identified above is in conformity with the relevant Union harmonisation legislation, ' +
        'including Regulation (EU) 2023/1542 of the European Parliament and of the Council concerning ' +
        'batteries and waste batteries.',
      56, y, { width: W, lineGap: 3 }
    );
    y = pdf.y + 14;

    pdf.font('Helvetica-Bold').fontSize(9).fillColor('#64748B').text('HARMONISED STANDARDS / REFERENCES', 56, y);
    pdf.font('Helvetica').fontSize(10.5).fillColor('#0F172A');
    (doc.standards || []).forEach((s) => {
      pdf.text(`•  ${s}`, 62, pdf.y + 4);
    });
    y = pdf.y + 22;

    pdf.font('Helvetica').fontSize(10).fillColor('#334155').text(
      `Signed for and on behalf of: ${tenant.companyName}`,
      56, y, { width: W }
    );
    pdf.text(`Name / role: ${doc.signerName || '—'}${doc.signerRole ? ` · ${doc.signerRole}` : ''}`, { width: W });
    pdf.text(`Place of issue: ${doc.place || '—'}`, { width: W });

    pdf.font('Helvetica').fontSize(8).fillColor('#94A3B8').text(
      `Verifiable online: ${url}   ·   Regulation (EU) 2023/1542, Article 13(6)`,
      56, pdf.page.height - 90, { width: W, align: 'center' }
    );
    pdf.font('Helvetica-Bold').fontSize(8).fillColor('#B45309').text(
      'DEMO — sample data, not a valid declaration.',
      56, pdf.page.height - 70, { width: W, align: 'center' }
    );

    pdf.end();
  });
}

export default { buildDocPdf };
