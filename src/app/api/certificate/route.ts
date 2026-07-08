import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getExamStatus, getOrCreateCertificateCode } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const status = await getExamStatus(user.id);
  const best = "bestPassedAttempt" in status ? status.bestPassedAttempt : null;

  if (!best) {
    return NextResponse.json(
      { error: "No passing exam attempt found for this account." },
      { status: 403 }
    );
  }

  const displayName = user.firstName || user.username || "Student";
  const verificationCode = await getOrCreateCertificateCode(user.id, displayName);

  const passedAttempt = best;
  const name = user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Student";
  const dateStr = new Date(passedAttempt.attempted_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const ink = rgb(0.118, 0.165, 0.133);
  const mustard = rgb(0.910, 0.682, 0.267);
  const coral = rgb(0.910, 0.416, 0.294);
  const grey = rgb(0.4, 0.4, 0.4);

  // Border
  page.drawRectangle({
    x: 30, y: 30, width: width - 60, height: height - 60,
    borderColor: mustard, borderWidth: 3,
  });
  page.drawRectangle({
    x: 40, y: 40, width: width - 80, height: height - 80,
    borderColor: coral, borderWidth: 1,
  });

  const centerText = (text: string, y: number, font: typeof bold, size: number, color = ink) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  centerText("MENTORA AI", height - 100, bold, 20, coral);
  centerText("Certificate of Completion", height - 150, bold, 32, ink);
  centerText("C# Programming Course", height - 185, italic, 16, ink);

  centerText("This certifies that", height - 240, regular, 14, ink);
  centerText(name, height - 280, bold, 28, mustard);
  centerText(
    "has successfully completed the Mentora AI C# Programming final exam",
    height - 315,
    regular,
    14,
    ink
  );
  centerText(`Overall score: ${passedAttempt.overall_percentage.toFixed(1)}%`, height - 340, regular, 13, ink);

  // --- Seal: two concentric circles with a checkmark, original to Mentora AI ---
  const sealX = width - 160;
  const sealY = 130;
  page.drawCircle({ x: sealX, y: sealY, size: 45, borderColor: mustard, borderWidth: 3 });
  page.drawCircle({ x: sealX, y: sealY, size: 36, borderColor: coral, borderWidth: 1.5 });
  // Checkmark drawn as two connected lines
  page.drawLine({
    start: { x: sealX - 16, y: sealY - 2 },
    end: { x: sealX - 5, y: sealY - 13 },
    thickness: 4,
    color: coral,
  });
  page.drawLine({
    start: { x: sealX - 5, y: sealY - 13 },
    end: { x: sealX + 18, y: sealY + 15 },
    thickness: 4,
    color: coral,
  });
  const sealLabel = "VERIFIED";
  const sealLabelWidth = bold.widthOfTextAtSize(sealLabel, 8);
  page.drawText(sealLabel, {
    x: sealX - sealLabelWidth / 2,
    y: sealY - 60,
    size: 8,
    font: bold,
    color: grey,
  });

  // --- Signature line ---
  const sigX = 140;
  const sigY = 130;
  page.drawLine({
    start: { x: sigX - 70, y: sigY },
    end: { x: sigX + 70, y: sigY },
    thickness: 1,
    color: grey,
  });
  const sigLabel = "Course Director, Mentora AI";
  const sigLabelWidth = regular.widthOfTextAtSize(sigLabel, 10);
  page.drawText(sigLabel, {
    x: sigX - sigLabelWidth / 2,
    y: sigY - 16,
    size: 10,
    font: regular,
    color: grey,
  });

  // --- Verification code + URL + date, bottom center ---
  const origin = new URL(req.url).origin;
  const verifyUrl = `${origin}/verify/${verificationCode}`;
  centerText(`Verify at: ${verifyUrl}`, 78, regular, 10, grey);
  centerText(`Issued: ${dateStr}`, 62, regular, 10, grey);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mentora-ai-certificate.pdf"`,
    },
  });
}
