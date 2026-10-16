import { saveAs } from "file-saver";
import JSZip from "jszip";
import type { DmuActivity } from "../types/dmu.ts";
import { generateDmuHtml, type DmuColors } from "./generateDmuHtml.ts";
import { primeDmuCss } from "./primeDmuCss.ts";

async function blobUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not read a replacement faculty photo.");
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not encode a faculty photo."));
    reader.readAsDataURL(blob);
  });
}

function publicAsset(fileName: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${fileName.replace(/^\//, "")}`;
}

async function bundledLogo(path: string): Promise<Blob> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}.`);
  }
  return response.blob();
}

async function embedFacultyPhotos(activity: DmuActivity): Promise<DmuActivity> {
  const faculty = await Promise.all(
    activity.faculty.map(async (member) => {
      if (!member.photo_url.startsWith("blob:")) {
        return member;
      }
      return { ...member, photo_url: await blobUrlToDataUrl(member.photo_url) };
    }),
  );
  return { ...activity, faculty };
}

export async function exportDmuZip(activity: DmuActivity, colors: DmuColors): Promise<void> {
  const exportActivity = await embedFacultyPhotos(activity);
  const html = generateDmuHtml(exportActivity, colors);
  const zip = new JSZip();
  zip.file("index.html", html);
  zip.file("css/PRIME_DMU.css", primeDmuCss);
  zip.file("images/PRIME_White.svg", await bundledLogo(publicAsset("images/PRIME_White.svg")));
  zip.file("images/live_webinar.svg", await bundledLogo(publicAsset("images/live_webinar.svg")));
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${activity.activityCode}_DMU.zip`);
}
