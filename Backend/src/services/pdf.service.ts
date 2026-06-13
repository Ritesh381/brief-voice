// Backend/src/services/pdf.service.ts

import PDFDocument from "pdfkit";
import { prisma } from "../db/prisma";

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Generates a PDF meeting report (title, date, attendees, key decisions, and
 * an action-item checklist) and resolves to the rendered file as a Buffer.
 * Throws if the meeting does not exist.
 */
export async function generatePDFReport(meetingId: string): Promise<Buffer> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { summary: true, actionItems: { orderBy: { createdAt: "asc" } } },
  });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(22).fillColor("#6366f1").text("BriefVoice Meeting Report", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor("#111").text(meeting.filename);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Generated: ${new Date().toISOString().slice(0, 10)}  |  Status: ${meeting.status}`);
    doc.moveDown();

    const section = (title: string, items: string[]) => {
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor("#6366f1").text(title);
      doc.moveDown(0.2);
      doc.fontSize(11).fillColor("#111");
      if (items.length === 0) {
        doc.fillColor("#999").text("— none —");
      } else {
        items.forEach((it) => doc.text(`•  ${it}`, { indent: 10 }));
      }
    };

    if (meeting.summary) {
      section("Attendees", parseJsonArray(meeting.summary.attendees));
      section("Key Decisions", parseJsonArray(meeting.summary.keyDecisions));
      section("Discussion Points", parseJsonArray(meeting.summary.discussionPoints));
      section("Open Questions", parseJsonArray(meeting.summary.openQuestions));
      section("Next Steps", parseJsonArray(meeting.summary.nextSteps));
    } else {
      doc.fontSize(11).fillColor("#999").text("No summary available for this meeting yet.");
    }

    // Action items checklist
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor("#6366f1").text("Action Items");
    doc.moveDown(0.2);
    doc.fontSize(11).fillColor("#111");
    if (meeting.actionItems.length === 0) {
      doc.fillColor("#999").text("— none —");
    } else {
      for (const item of meeting.actionItems) {
        const box = item.completed ? "[x]" : "[ ]";
        const meta = [item.owner, item.deadline].filter(Boolean).join(" · ");
        doc.text(`${box}  ${item.task}${meta ? `  (${meta})` : ""}`, { indent: 10 });
      }
    }

    doc.end();
  });
}
