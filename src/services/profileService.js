import { readGuildDB, writeGuildDB } from "../utils/core/file.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export async function createProfileCard(guildId, user) {
  const db = await readGuildDB();
  const data = db[guildId]?.users?.[user.id] || {
    xp: 0,
    level: 1,
    vxp: 0,
    vlevel: 1,
    profileBackground: null,
  };

  const width = 900;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 背景
  if (data.profileBackground) {
    try {
      const bgImg = await loadImage(data.profileBackground);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, width, height);

  const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));
  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 150, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 200, 200);
  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "36px Sans";
  ctx.fillText(user.username, 280, 100);

  ctx.font = "26px Sans";
  ctx.fillText(`Level: ${data.level}`, 280, 160);
  ctx.fillText(`XP: ${data.xp}`, 280, 200);
  ctx.fillText(`Voice Level: ${data.vlevel}`, 280, 240);
  ctx.fillText(`VXP: ${data.vxp}`, 280, 280);

  return canvas.toBuffer("image/png");
}
