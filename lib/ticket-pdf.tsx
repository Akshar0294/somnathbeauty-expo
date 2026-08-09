import { PDFDocument } from "pdf-lib";
import { render } from "takumi-js";
import { Renderer } from "@takumi-rs/wasm/node";
import QRCode from "qrcode";

const IMAGE_WIDTH = 794;
const IMAGE_HEIGHT = 1123;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;
const takumiRenderer = new Renderer();

export type TicketPdfData = {
  registrationId: string;
  visitorName: string;
  eventId: string;
  eventName: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  amount: number;
  paymentId: string;
  qrValue: string;
};

export async function createTicketPdf(data: TicketPdfData) {
  const qrCode = await QRCode.toDataURL(data.qrValue, {
    width: 360,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#111827", light: "#ffffff" }
  });
  const amount = `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(data.amount)}`;
  const image = await render(
    <div tw="w-full h-full flex flex-col bg-[#f8f3f0] p-[56px] text-[#111827]" style={{ fontFamily: "Geist" }}>
      <div tw="flex flex-1 flex-col overflow-hidden rounded-[28px] bg-white">
        <div tw="flex items-start justify-between bg-[#111827] px-[48px] py-[42px]">
          <div tw="flex flex-col">
            <div tw="text-[24px] font-bold tracking-[4px] text-[#f2c5cc]">SOFT SHINE</div>
            <div tw="mt-[8px] text-[14px] font-bold tracking-[3px] text-[#ffffff]">COSMETIC</div>
          </div>
          <div tw="rounded-full bg-[#dff5e3] px-[18px] py-[10px] text-[18px] font-bold text-[#15803d]">PAID</div>
        </div>

        <div tw="flex flex-1 flex-col px-[48px] py-[46px]">
          <div tw="text-[18px] font-bold tracking-[4px] text-[#b76e79]">ENTRY TICKET</div>
          <div tw="mt-[20px] max-w-[620px] text-[52px] font-bold leading-[1.05] text-[#111827]">{data.eventName}</div>
          <div tw="mt-[16px] text-[20px] text-[#64748b]">Your place is confirmed.</div>

          <div tw="mt-[52px] flex items-start justify-between">
            <div tw="flex w-[420px] flex-col gap-[28px]">
              <div tw="flex flex-col">
                <div tw="text-[13px] font-bold tracking-[2px] text-[#64748b]">ATTENDEE</div>
                <div tw="mt-[8px] text-[24px] font-bold text-[#111827]">{data.visitorName}</div>
              </div>
              <div tw="flex flex-col">
                <div tw="text-[13px] font-bold tracking-[2px] text-[#64748b]">DATE &amp; TIME</div>
                <div tw="mt-[8px] text-[21px] font-bold text-[#111827]">{data.date}</div>
                <div tw="mt-[5px] text-[18px] text-[#64748b]">{data.time}</div>
              </div>
              <div tw="flex flex-col">
                <div tw="text-[13px] font-bold tracking-[2px] text-[#64748b]">VENUE</div>
                <div tw="mt-[8px] text-[21px] font-bold text-[#111827]">{data.venue}</div>
                <div tw="mt-[5px] text-[17px] leading-[1.35] text-[#64748b]">{data.address}</div>
              </div>
            </div>
            <div tw="flex flex-col items-center rounded-[20px] bg-[#f7e7ea] p-[22px]">
              <img src={qrCode} width={220} height={220} alt="Ticket QR code" />
              <div tw="mt-[14px] text-[16px] font-bold text-[#111827]">Scan at entry</div>
              <div tw="mt-[8px] text-[12px] text-[#64748b]">Ticket verification</div>
            </div>
          </div>

          <div tw="mt-auto flex flex-col">
            <div tw="h-[2px] w-full bg-[#e5e7eb]" />
            <div tw="mt-[28px] flex items-end justify-between">
              <div tw="flex flex-col">
                <div tw="text-[13px] font-bold tracking-[2px] text-[#64748b]">REGISTRATION ID</div>
                <div tw="mt-[8px] text-[25px] font-bold text-[#111827]">{data.registrationId}</div>
              </div>
              <div tw="flex flex-col items-end">
                <div tw="text-[13px] font-bold tracking-[2px] text-[#64748b]">AMOUNT PAID</div>
                <div tw="mt-[8px] text-[25px] font-bold text-[#b76e79]">{amount}</div>
              </div>
            </div>
            <div tw="mt-[32px] rounded-[16px] bg-[#111827] p-[24px] text-[15px] leading-[1.5] text-white">Show this ticket and a valid photo ID at entry. Payment reference: {data.paymentId}</div>
          </div>
        </div>
      </div>
      <div tw="mt-[22px] flex items-center justify-between text-[13px] text-[#64748b]">
        <div>Soft Shine Cosmetic · Beauty. Quality. Wholesale.</div>
        <div>Keep this ticket safe</div>
      </div>
    </div>,
    { width: IMAGE_WIDTH, height: IMAGE_HEIGHT, renderer: takumiRenderer }
  );

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${data.eventName} ticket`);
  pdf.setAuthor("Soft Shine Cosmetic");
  const page = pdf.addPage([PDF_WIDTH, PDF_HEIGHT]);
  const ticketImage = await pdf.embedPng(image);
  page.drawImage(ticketImage, { x: 0, y: 0, width: PDF_WIDTH, height: PDF_HEIGHT });
  return pdf.save();
}
