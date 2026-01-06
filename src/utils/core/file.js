import fs from "fs";
import path from "path";

// Guild DB
const guildDBPath = path.join(process.cwd(), "database", "guilds.json");

export async function readGuildDB() {
  if (!fs.existsSync(guildDBPath)) {
    fs.writeFileSync(guildDBPath, JSON.stringify({}));
  }
  const raw = fs.readFileSync(guildDBPath, "utf-8");
  return JSON.parse(raw);
}

export async function writeGuildDB(data) {
  fs.writeFileSync(guildDBPath, JSON.stringify(data, null, 2));
}

// User DB
const userDBPath = path.join(process.cwd(), "database", "users");

if (!fs.existsSync(userDBPath)) {
  fs.mkdirSync(userDBPath, { recursive: true });
}

export function readUserDB(userId) {
  const file = path.join(userDBPath, `${userId}.json`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({}));
  }
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw);
}

export function writeUserDB(userId, data) {
  const file = path.join(userDBPath, `${userId}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
export {readGuildDB as getGuild}
export {writeGuildDB as updateGuild}
