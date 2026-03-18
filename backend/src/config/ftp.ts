import * as ftp from "basic-ftp";
import dotenv from 'dotenv';

dotenv.config();

export async function getFtpClient() {
  const client = new ftp.Client(30000); // 30s timeout
  client.ftp.verbose = true; // VERY IMPORTANT: Let's see the logs in the backend terminal
  
  await client.access({
    host: process.env.FTP_HOST || "localhost",
    user: process.env.FTP_USER || "anonymous",
    password: process.env.FTP_PASS || "",
    port: parseInt(process.env.FTP_PORT || "21"),
    // Le serveur exige explicitement le TLS (Erreur 530 TLS Required)
    secure: true,
    secureOptions: { rejectUnauthorized: false }
  });
  return client;
}
