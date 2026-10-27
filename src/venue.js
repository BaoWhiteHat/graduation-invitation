// A two-page invitation: the ceremony first, practical directions second.
export const VENUE = {
  event: 'Lễ tốt nghiệp', host: 'Lê Quốc Bảo', program: 'Chương trình liên kết BCU × UIT',
  weekday: 'Thứ Hai', date: '16/11/2026', time: '13:00 – 16:00', photoTime: '15:45',
  hall: 'Hội trường A', school: 'Trường Đại học Công nghệ Thông tin – ĐHQG-HCM (UIT)',
  address: 'Đường Hàn Thuyên, Khu phố 6, Phường Linh Xuân, TP. Hồ Chí Minh',
  oldAddress: 'Địa chỉ cũ trên một số bản đồ: P. Linh Trung, TP. Thủ Đức',
  phone: '0938 030 539', tel: 'tel:0938030539', mapsQuery: 'Trường Đại học Công nghệ Thông tin ĐHQG-HCM'
};
export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(VENUE.mapsQuery)}`;
const FILE_NAME = 'thu-moi-le-quoc-bao-16-11-2026.pdf';
const PAGE_W = 1240, PAGE_H = 1754, RENDER = 2; // 300 dpi on A4.
const A4 = [595.28, 841.89];
const SANS = '"Space Grotesk", "Segoe UI", sans-serif';
const SERIF = '"Invitation Serif", Georgia, serif';
const NAVY = '#152d43', INK = '#304654', MUTED = '#52616c';
const GOLD = '#d0b683', CREAM = '#f5efdf', PAPER = '#fbf8f0';
// Load during the story so the tap can save/share immediately with Vietnamese glyphs ready.
const invitationFontsReady = Promise.all([
  document.fonts.load('400 32px "Invitation Serif"'),
  document.fonts.load('italic 400 32px "Invitation Serif"')
]);

function wrap(ctx, value, width) {
  const lines = [];
  let line = '';
  for (const word of value.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function createPage(number, label, dark = false) {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W * RENDER;
  canvas.height = PAGE_H * RENDER;
  const ctx = canvas.getContext('2d');
  ctx.scale(RENDER, RENDER);
  ctx.fillStyle = dark ? NAVY : PAPER;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  const links = [];
  const text = (value, x, y, size = 28, color = INK, align = 'left', family = SANS, weight = '400', maxWidth = 1040) => {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = align;
    ctx.fillText(value, x, y, maxWidth);
  };
  const paragraph = (value, x, y, width, size = 28, lineHeight = 43, color = INK, align = 'left') => {
    ctx.font = `400 ${size}px ${SANS}`;
    const lines = wrap(ctx, value, width);
    lines.forEach((line, i) => text(line, x, y + i * lineHeight, size, color, align));
    return y + lines.length * lineHeight;
  };
  const line = (x1, y1, x2, y2, color = GOLD, width = 1) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  };
  line(110, 1636, 1130, 1636, dark ? '#53616a' : '#d5ccba');
  text('LÊ QUỐC BẢO  /  BCU × UIT', 110, 1678, 18, dark ? GOLD : MUTED, 'left', SANS, '500');
  text(`${label}  ·  ${number}/2`, 1130, 1678, 18, dark ? GOLD : MUTED, 'right', SANS, '500');
  return { canvas, links, text, paragraph, line };
}

function drawInvitation(guest) {
  const p = createPage(1, 'THƯ MỜI', true);
  const { text, paragraph, line, links } = p;
  text('BCU × UIT', 110, 124, 25, CREAM, 'left', SANS, '600');
  text('CLASS OF 2026', 1130, 124, 22, GOLD, 'right', SANS, '500');
  line(110, 165, 1130, 165, '#53616a');
  text('Thư mời', 110, 338, 108, CREAM, 'left', SERIF);
  text('LỄ TỐT NGHIỆP', 110, 411, 26, GOLD, 'left', SANS, '500');
  text(VENUE.host, 110, 578, 86, CREAM, 'left', SERIF);
  text(VENUE.program, 110, 638, 27, CREAM);
  text('Trân trọng kính mời', 110, 758, 32, CREAM, 'left', SERIF, 'italic');
  text(guest, 110, 831, 49, CREAM, 'left', SERIF, '400', 1010);
  paragraph('Đến chung vui cùng Bảo, lưu lại một tấm hình và chia sẻ niềm vui của một chặng đường vừa hoàn thành.', 110, 930, 1000, 30, 46, CREAM);
  line(110, 1068, 1130, 1068, '#758075');
  text('16', 110, 1195, 112, CREAM, 'left', SERIF);
  text('THÁNG 11, 2026', 110, 1248, 25, GOLD, 'left', SANS, '500');
  text('THỨ HAI', 110, 1290, 23, CREAM);
  line(590, 1112, 590, 1290, '#758075');
  text(VENUE.time, 650, 1173, 42, CREAM, 'left', SANS, '600', 480);
  text(VENUE.hall, 650, 1238, 36, CREAM, 'left', SERIF);
  text('UIT · ĐHQG-HCM', 650, 1288, 26, GOLD);
  text(`Lễ kéo dài tới khoảng ${VENUE.photoTime}. Bận thì cứ ghé lúc đó để chụp ảnh nhé.`, 110, 1352, 25, CREAM, 'left', SERIF, 'italic', 1020);
  text('Trường Đại học Công nghệ Thông tin', 110, 1400, 29, CREAM);
  text('Đại học Quốc gia TP. Hồ Chí Minh', 110, 1446, 27, CREAM);
  text('Mở Google Maps tới trường', 110, 1533, 28, CREAM, 'left', SANS, '500');
  line(110, 1544, 565, 1544, GOLD);
  line(1088, 1527, 1116, 1502, GOLD, 2); line(1096, 1502, 1116, 1502, GOLD, 2); line(1116, 1502, 1116, 1522, GOLD, 2);
  text('Rất mong được gặp bạn trong ngày đặc biệt này.', 110, 1600, 25, CREAM, 'left', SERIF, 'italic');
  links.push({ x: 96, y: 1480, w: 1048, h: 90, url: mapsUrl });
  return p;
}

function drawDirections(guest) {
  const p = createPage(2, 'ĐƯỜNG ĐI');
  const { text, paragraph, line, links } = p;
  text('LÊ QUỐC BẢO', 110, 124, 24, NAVY, 'left', SANS, '600');
  text('THÔNG TIN DỰ LỄ', 1130, 124, 22, MUTED, 'right', SANS, '500');
  line(110, 165, 1130, 165, '#c8b791');
  text('Đường đến UIT', 110, 300, 80, NAVY, 'left', SERIF);
  text(`${VENUE.date}  ·  ${VENUE.time}`, 110, 362, 29, INK);
  text(`Dành cho ${guest}`, 110, 418, 28, MUTED, 'left', SERIF, 'italic', 1000);
  text(VENUE.hall, 110, 477, 42, NAVY, 'left', SERIF);
  paragraph(VENUE.school, 110, 535, 1000, 29, 42);
  paragraph(VENUE.address, 110, 637, 1000, 28, 40);
  text(VENUE.oldAddress, 110, 724, 22, MUTED, 'left', SANS, '400', 1000);
  text('Mở Google Maps đến UIT', 110, 823, 31, NAVY, 'left', SANS, '600');
  line(110, 838, 670, 838, NAVY, 1);
  line(1084, 819, 1114, 792, NAVY, 2.2); line(1094, 792, 1114, 792, NAVY, 2.2); line(1114, 792, 1114, 812, NAVY, 2.2);
  links.push({ x: 96, y: 770, w: 1048, h: 90, url: mapsUrl });
  const routes = [
    ['Xe máy, ô tô hoặc Grab', 'Chọn điểm đến “Cổng UIT - đường Hàn Thuyên”. Vào trường, theo bảng chỉ dẫn đến Hội trường A.'],
    ['Metro số 1', 'Xuống ga Đại học Quốc gia, rồi đi bộ đến Cổng B UIT theo Google Maps. Nếu không rành đường, bạn có thể bắt Grab đến cổng trường.'],
    ['Khi vào trường', 'Cổng chính hoặc Cổng B đều được. Bạn có thể hỏi bảo vệ để tìm Hội trường A, hoặc gọi cho Bảo.']
  ];
  let y = 936;
  routes.forEach(([title, body], i) => {
    text(`0${i + 1}`, 110, y, 22, MUTED, 'left', SANS, '500');
    text(title, 176, y, 31, NAVY, 'left', SANS, '600');
    y = paragraph(body, 176, y + 46, 954, 28, 40) + 34;
  });
  line(110, 1475, 1130, 1475, '#c8b791');
  text('Liên hệ Bảo nếu bạn cần hỏi đường', 110, 1522, 25, MUTED);
  text(VENUE.phone, 110, 1582, 43, NAVY, 'left', SANS, '600');
  links.push({ x: 96, y: 1490, w: 1048, h: 112, url: VENUE.tel });
  return p;
}

const ascii = text => new TextEncoder().encode(text);
function utf16Hex(text) {
  let hex = 'FEFF';
  for (let i = 0; i < text.length; i++) hex += text.charCodeAt(i).toString(16).padStart(4, '0');
  return `<${hex}>`;
}
function dataUrlBytes(dataUrl) {
  return Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), char => char.charCodeAt(0));
}

// Each page has its own image and tappable map/phone annotations.
function buildPdf(pages, title) {
  const pageIds = pages.map((_, i) => 4 + i * 3);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    `<< /Title ${utf16Hex(title)} /Producer (GRAD-2026 invitation) >>`
  ];
  const annotations = [];
  const firstAnnot = 4 + pages.length * 3;
  for (const [i, page] of pages.entries()) {
    const annotationIds = page.links.map(({ x, y, w, h, url }) => {
      const rect = [x / PAGE_W * A4[0], A4[1] * (1 - (y + h) / PAGE_H), (x + w) / PAGE_W * A4[0], A4[1] * (1 - y / PAGE_H)].map(n => n.toFixed(2)).join(' ');
      const id = firstAnnot + annotations.length;
      annotations.push(`<< /Type /Annot /Subtype /Link /Rect [${rect}] /Border [0 0 0] /A << /S /URI /URI (${url.replace(/[()\\]/g, '\\$&')}) >> >>`);
      return `${id} 0 R`;
    });
    const id = pageIds[i];
    const content = `q ${A4[0]} 0 0 ${A4[1]} 0 0 cm /Im0 Do Q`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4[0]} ${A4[1]}] /Resources << /XObject << /Im0 ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R /Annots [${annotationIds.join(' ')}] >>`,
      { head: `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>`, stream: page.jpeg },
      { head: `<< /Length ${content.length} >>`, stream: ascii(content) }
    );
  }
  objects.push(...annotations);
  const parts = [], offsets = [];
  let length = 0;
  const push = bytes => { parts.push(bytes); length += bytes.length; };
  push(ascii('%PDF-1.4\n'));
  objects.forEach((object, i) => {
    offsets.push(length);
    if (typeof object === 'string') push(ascii(`${i + 1} 0 obj\n${object}\nendobj\n`));
    else {
      push(ascii(`${i + 1} 0 obj\n${object.head}\nstream\n`)); push(object.stream); push(ascii('\nendstream\nendobj\n'));
    }
  });
  const xref = length;
  let table = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) table += `${String(offset).padStart(10, '0')} 00000 n \n`;
  push(ascii(`${table}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  return new Blob(parts, { type: 'application/pdf' });
}

export function makeVenuePdf(guest = 'Vị khách đặc biệt') {
  const recipient = String(guest).trim().slice(0, 30) || 'Vị khách đặc biệt';
  const pages = [() => drawInvitation(recipient), () => drawDirections(recipient)].map(draw => {
    const { canvas, links } = draw();
    const page = { jpeg: dataUrlBytes(canvas.toDataURL('image/jpeg', .94)), width: canvas.width, height: canvas.height, links };
    canvas.width = canvas.height = 0;
    return page;
  });
  return new File([buildPdf(pages, `Thư mời tốt nghiệp ${VENUE.host} - ${VENUE.date}`)], FILE_NAME, { type: 'application/pdf' });
}

export async function saveVenueCard(guest) {
  await invitationFontsReady;
  const file = makeVenuePdf(guest);
  if (window.matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `Thư mời tốt nghiệp - ${VENUE.host}` }); return; }
    catch (error) { if (error?.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = file.name; document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
